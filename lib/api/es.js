'use strict'
var config = require('../../config.js');
var utils = require('../utils.js');
// var log = require('bunyan');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: config.elasticsearch.server
});

var ejs = require('elastic.js');


var search = {
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
      index: 'myndasofn',
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
  main : function (search, callback){
    var limit = search.limit || 50;
    var offset = search.offset || 0;
    var filters, FiltersArrray, data;

    var body =  ejs.Request()
            .query(ejs.QueryStringQuery(search.query))

    if(search.filter){
      filters = CreateFilter(search.filter);
      FiltersArrray = filters.map(function (Filter){
        return ejs.TermFilter (Filter.key, Filter.value)
      });

      body.filter(ejs.BoolFilter().must(FiltersArrray))
    }

    client.search({
      limit : limit,
      offset : offset,
      index: 'myndasofn',
      body:body

    }, function (error, response) {

      console.log(error, response);
      if(error){
        return callback(error);
      }
      callback(null, utils.formatResponse(response));
    });
  },
  advanced : function (BodyParams, QueryParams, callback){
    var limit = QueryParams.limit || 50;
    var offset = QueryParams.offset || 0;
    var queryObject = SafeQuery(BodyParams);
    var data;
    if(queryObject){
      client.search({
        limit : limit,
        offset : offset,
        index: 'myndasofn',
        body:queryObject

      }, function (error, response) {
        if(!error){
          data = utils.formatResponse(response);
        }
        console.log(response);
        callback(error, data);
      });
    }
  },
  filter : function (search, callback){
    var limit = search.limit || 50;
    var offset = search.offset || 0;
    var f = CreateFilter(search.filter);

    var filters = f.map(function (Filter){
      return ejs.TermFilter (Filter.key, Filter.value)
    });

    var body = ejs.Request()
            .filter(ejs.BoolFilter().must(filters))
    client.search({
      limit : limit,
      offset : offset,
      index: 'myndasofn',
      body: body
    }, function (error, response) {
      callback(error, response);
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

function CreateFilter(filter){
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
			index: index,
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
