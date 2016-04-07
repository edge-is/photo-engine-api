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
  search : function (req, res, next){

    var param, query = req.query.query, filter = req.query.filter;
    if(!query && !filter){
      return next(new errors.BadRequestError ("key:'query' is needed"));
    }
    for (var key in req.params){
      param = req.params[key];
    }
    if(req.params.type === 'typeahead'){
      res.cache('public', {maxAge : 300});
      search.typeahead({ query : query}, function (err, hits){
        if(err) return res.send(BadUsageError(err));
        res.send({data:hits});
      });
      //res.send({ok:'bla'});
    }else if (req.params.type === 'main'){
      search.main(req.query, function (err, hits){
        if(err) return res.send(BadUsageError(err));
        res.send({data:hits});
      });
    }else if (req.params.type === 'filter'){
      search.filter(req.query, function (err, hits){
        if(err) return res.send(BadUsageError(err));
        res.send({data:hits});
      });
    }else{
        var errorMsg = "Param '{{param}}' not valid".format({param : param});
        return next(new errors.NotFoundError(errorMsg));
    }
    //res.send({ok:'bla'});
    next();
  },
  queryStringSearch : function (req, res, next){
    var param, query = req.query.query, filter = req.query.filter;
    if(!query && !filter){
      return next(new errors.BadRequestError ("key:'query' is needed"));
    }

    console.log('fooo')
    search.main(req.query, function (err, hits){
      console.log('FUCKING ERROR', err);
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
    });
    return next();
  },
  typeahead : function (req, res, next){
    res.cache('public', {maxAge : 300});
    search.typeahead({ query : query}, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
    });
    return next();
  },
  filterSearch : function (req, res, next){
    search.filter(req.query, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
    });

    return next();
  },
  mapping : function (req, res, next) {
    mappings.get('myndasetur', 'image', function (err, response){
      if(err) return res.send(BadUsageError(err));
      res.send(response);
    });

    next();
  },
  advancedSearch : function (req, res, next) {
    search.advanced(req.body, req.query, function (err, hits){
      if(err) return res.send(BadUsageError(err));
      res.send({data:hits});
    });
  }

};


module.exports = api;
