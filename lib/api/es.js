'use strict'
var config = require('../../config.js');
var utils = require('../utils.js');
// var log = require('bunyan');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: config.elasticsearch.server
});

var ejs = require('elastic.js');

/** FIXME: DYNAMIC INDEX SELECTON **/

function selectIndex(object){
  if (typeof config.index === 'function'){
    //.. run function to get it..
  }
  return config.index;
}


function logQuery(query){
  var json = JSON.stringify(query.toJSON(), null, 2);

  console.log(json);
}


var search = {
  getByID : function (id, callback){
    client.get({
      index: selectIndex(),
      type: 'image',
      id: id
    }, function (error, response) {
      if(error)  return callback(error);

      callback(null, [utils.createNameHash([response])]);

      // ...
    });
  },
  suggest : function (query, filter, callback){

    // Myndatexti:Description, Heimild:UserDefined3, ljósmyndari:Credit
    //
    // Ítarupplýsingar:LocalCaption, flokkur?:Category,  LYkilorð?


    var fields = [
      {field : 'Description',   minWordLen : 2, suggestMode : 'popular', stringDistance : 'levenstein' , accuracy:0.1 },
      {field : 'UserDefined3',  minWordLen : 2, suggestMode : 'popular', stringDistance : 'levenstein' , accuracy:0.3 },
      {field : 'Credit',        minWordLen : 2, suggestMode : 'popular', stringDistance : 'levenstein' , accuracy:0.4 },
      {field : 'LocalCaption',  minWordLen : 2, suggestMode : 'popular', stringDistance : 'levenstein' , accuracy:0.7 },
      {field : 'Category',      minWordLen : 2, suggestMode : 'popular', stringDistance : 'levenstein' , accuracy:0.9 },
    ];

    var filters = parseFilter(filter);

    var filtersArray = filters.map(function (filter){

      var key = filter.key;

      var value = filter.value;

      // Must set value to lowerCase if analysed filed;
      if (key.indexOf('.raw') === -1){
        value = value.toLowerCase();
      }


      return ejs.TermFilter (filter.key, filter.value)
    });

    var searchBody = ejs.Request();


    fields.forEach(function (object){
      searchBody.suggest(
        ejs.TermSuggester(object.field)
           .field(object.field)
           .text(query)
           .minWordLen(object.minWordLen)
           .suggestMode(object.suggestMode)
          .stringDistance(object.stringDistance)
          .accuracy(object.accuracy)
      )
    });

    if(filter){
      searchBody.filter(ejs.BoolFilter()
         .must(filtersArray))
    }
    // .suggest(
    //   ejs.TermSuggester ('Description').field('Description').text(query)
    // )
    // .suggest(
    //   ejs.TermSuggester ('LocalCaption').field('LocalCaption').text(query)
    // );

    //
    // if (query){
    //   searchBody.query(ejs.QueryStringQuery(query))
    // }

    logQuery(searchBody);

    client.search({
      index: selectIndex(),
      type: 'image',
      size: 0,
      body: searchBody
    }, function (error, response) {
      console.log(response);
      if(error)  return callback(error);
      //return callback(null, response);
      callback(null, response);

      // ...
    });
  },
  getAggregate : function(key, query, filter, callback){

    var field = key + ".raw";

    var aggregationRequest = ejs.TermsAggregation('request_aggregation').field(field);

    if (key === 'archive'){
      aggregationRequest.aggregation(ejs.TermsAggregation('archive_ids').field('archive_id'))
    }

    var filters = parseFilter(filter);

    var filtersArray = filters.map(function (filter){

      var key = filter.key;

      var value = filter.value;

      // Must set value to lowerCase if analysed filed;
      if (key.indexOf('.raw') === -1){
        value = value.toLowerCase();
      }


      return ejs.TermFilter (filter.key, filter.value)
    });

    var searchBody = ejs.Request()
                  .aggregation(
                    ejs.FilterAggregation('results')
                        .filter(
                          ejs.BoolFilter()
                             .must(filtersArray)
                           ).aggregation(aggregationRequest)
              );

    if (query){
      searchBody.query(ejs.QueryStringQuery(query))
    }

    //logQuery(searchBody);

    client.search({
      index: selectIndex(),
      type: 'image',
      size: 0,
      body: searchBody
    }, function (error, response) {
      console.log(response);
      if(error)  return callback(error);
      //return callback(null, response);
      callback(null, utils.aggregations(response));

      // ...
    });
  },
  getRandomImagesFromArchiveByID : function (archive_id, callback){

    var seed = Math.floor(Math.random() * 100);

    var searchBody = ejs.Request()
                  .query(
                    ejs.FunctionScoreQuery()
                        .functions([
                          ejs.RandomScoreFunction()
                             .seed(seed)
                        ]).scoreMode('sum')
                        .filter(ejs.BoolFilter().must([
                          ejs.TermFilter('archive_id', archive_id)
                        ]))
                );

    // console.log(JSON.stringify(body.toJSON(), null, 2));
    client.search({
      index: selectIndex(),
      type: 'image',
      size: 10,
      body: searchBody
    }, function (error, response) {
      if(error)  return callback(error);

      callback(null, utils.formatResponse(response));

      // ...
    });


  },

  /**
   * Typeahead search
   * @param  {object}   search   - object containing key for elasticsearch
   * @param  {Function} callback - callback after function is done
   * @return {undefined}         - No return
   */
  typeahead : function (search, callback){
    /*
    FIXME:User defined filter needed. should get that from config, search or db
    */
    if(!search.query){
      callback('query is not defined');
    }

    client.search({
      index: selectIndex(),
      type : 'image',
      body: ejs.Request()
              .query(ejs.QueryStringQuery(search.query))

    }, function (error, response) {
      if(error){callback(error); return;}
      var documents = [], hits = [];
       response.hits.hits.forEach(function (value, key){
         var hit = utils.contains(value, search.query);

         documents.push({
           _index  : value._index,
           _type  : value._type,
           _score : value._score,
           _id : value._id,
           _hit : hit
         });
         hits.push({
           hit : hit
         });
       })

       callback(null, {
         _meta : documents,
         hits : hits.dedupe({key : 'hit'})
       });
      //callback(null, utils.formatResponse(response));
      // handle response
    });

  },
  /**
   * Main search function, for search in all function
   * @param  {object}   search   - Object containing elasticsearch settings
   * @param  {Function} callback - Callback
   * @return {undefined}
   */
  queryStringSearch : function (query, filter, offset, limit, callback){
    limit = limit || 50;
    offset = offset || 0;

    var op = "AND"

    var queryObject = ejs.QueryStringQuery(query)
                         .defaultOperator(op);

    var requestBody =  ejs.Request();

    if (query){
      requestBody.query(queryObject);
    }

    var filters = parseFilter(filter);
    var filtersArray = filters.map(function (filter){

      var key = filter.key;

      var value = filter.value;

      if (key.indexOf('.raw') === -1){
        value = value.toLowerCase();
      }

      // Must set value to lowerCase if analysed filed;
      return ejs.TermFilter (filter.key, filter.value)
    });

    // filtersArray.forEach(function (i){
    //   logQuery(i)
    // });"archive": "Anna og Áslaug Magnúsdætur 2007_38"

    //"FileName": "2010_45_TJ_00116.jpg"
    if(filter){
      requestBody.filter(ejs.BoolFilter().must(filtersArray))
    }

    logQuery(requestBody);

    client.search({
      size  : limit,
      from  : offset,
      type  : 'image',
      index : selectIndex(),
      body  : requestBody

    }, function (error, response) {
      if(error)  return callback(error);

      callback(null, utils.formatResponse(response));
    });
  },
  advanced : function (bodyParams, queryParams, callback){

    console.log('ADVANCED', bodyParams, queryParams);

    if (!bodyParams.query){
      return callback('No query object');
    }

    // build search query
    //
    var body =  ejs.Request();

    bodyParams.query.forEach(function (item){
      var key = item.key.key;
      var searchString = item.query;

      body.query(ejs.FuzzyQuery(key, searchString));
    });
    console.log(body);

    var limit = queryParams.limit || 50;
    var offset = queryParams.offset || 0;
    var queryObject = SafeQuery(bodyParams);

    if(queryObject){
      client.search({
        size : limit,
        from : offset,
        type : 'image',
        index: selectIndex(),
        body:body

      }, function (error, response) {
        if (error) return callback(error);
        callback(error, utils.formatResponse(response));
      });
    }
  },
  filter : function (search, callback){
    var limit = search.limit || 10;
    var offset = search.offset || 0;
    var f = parseFilter(search.filter);

    var filters = f.map(function (Filter){
      return ejs.TermFilter (Filter.key, Filter.value)
    });

    var body = ejs.Request()
            .filter(ejs.BoolFilter().must(filters))
    client.search({
      size : limit,
      from : offset,
      index: selectIndex(),
      body: body
    }, function (error, response) {
      if (error) return callback(error);
      callback(error, utils.formatResponse(response));
      // handle response
    });

  //  callback(null, {hi:'there'});
 }
};

function SafeQuery (query){
  if(typeof query === 'string'){
    try {
      return JSON.parse(query);
    }catch (e){
      return false;
    }
  }else if (typeof query ==='object'){
    return query;
  }


  // else return false;
}

function parseFilter(filter){
  if (!filter) return [];

  // Split it up
  //
  //If index of ..
  var FilterArray = [];
  if (filter.indexOf(',') > -1){
    filter = filter.split(',');
    FilterArray = filter.map(function (string){
      return  KeyValueIt(string);
    })
  }else{
    FilterArray.push(KeyValueIt(filter));
  }

  return FilterArray;

}
function KeyValueIt(string){
  var key, value;
  var arr = string.split(':');
    key = arr[0];
    value = arr[1];
  return {key : key, value : value};
}

var mappings = {
  get : function (index, type, callback){
    client.indices.getMapping({
			index: selectIndex(),
			type : type
		},function (error, response){
			if (error){
		  		callback(error);
	  	}else{
	  		callback(error, response);
	  	}
	});

  }
};

module.exports={
  search : search,
  mappings : mappings
};
