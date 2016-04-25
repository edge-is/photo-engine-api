'use strict'
var api;
require('../utils');
var config = require('../../config.js');

var errors = require('restify-errors');

var search = require('./es.js').search;
var mappings = require('./es.js').mappings;

var BadUsageError = function (message){
  return new errors.BadRequestError({
        message: JSON.stringify(message)
    });
}


api = {
  image : function (req, res, next){
    if (!req.params.id) return next( new errors.BadRequestError('No filename') );
    // res.send('foo');
    search.getByID(req.params.id, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
      return next();
    });
  },
  aggregate : function (req, res, next){

    var key = req.params.key;

    var filter  = req.query.filter || false;
    var query   = req.query.query  || false;

    if (!key) return next( new errors.BadRequestError('No key') );

    search.getAggregate(key, query, filter, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
      return next();
    });
  },
  suggest : function (req, res, next){
    var filter  = req.query.filter;
    var query   = req.query.query;
    var type    = req.params.type;
    var fields  = req.query.fields;

    search.suggest(query, filter, type, fields, function (err, hits){
      if(err) return res.send(BadUsageError(err));

      res.send({data : hits});
      return next();
    });


  },
  randomImagesByArchiveID : function (req, res, next){

    // FIXME: Implement cache

    var archive_id = req.query.archive_id;

    if (!archive_id)  return next( new errors.BadRequestError('No archive_id') );



    search.getRandomImagesFromArchiveByID(archive_id, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
      return next();
    });

  },
  queryStringSearch : function (req, res, next){
    var param,
        query = req.query.query,
        filter = req.query.filter,
        offset = req.query.offset,
        limit = req.query.limit;


    if(!query && !filter){
      return next(new errors.BadRequestError ("key:'query' or 'filter' is needed"));
    }
    search.queryStringSearch(query, filter, offset, limit, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
      return next();
    });
    return next();
  },
  typeahead : function (req, res, next){
    res.cache('public', {maxAge : 300});

    search.typeahead({ query : req.query.query}, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
      return next();
    });
    return next();
  },
  filterSearch : function (req, res, next){
    if (!req.query.filter) return next(new errors.BadRequestError ("Filter is needed (queryparam)"))

    search.filter(req.query, function (err, hits){
      if(err) return res.send(BadUsageError(err));


      res.send({data:hits});
      return next();
    });

    return next();
  },
  mapping : function (req, res, next) {
    mappings.get('myndasetur', 'image', function (err, response){
      if(err) return res.send(BadUsageError(err));
      res.send(response);
      return next();
    });
  },
  advancedSearch : function (req, res, next) {
    search.advanced(req.body, req.query, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
      return next();
    });
  }

};


module.exports = api;
