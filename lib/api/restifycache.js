


var tim = require('tinytim').tim;

var utils = require('../utils.js');


var rediscachehandler = require('../rediscachehandler.js');
var client = rediscachehandler({
  compression : 'gzip'
});

var errors = require('restify-errors');

function querySorter (a,b){
  if (a.key < b.key) {
    return -1;
  }
  if (a.key > b.key) {
    return 1;
  }
  return 0;
}


function serializeQuery (query){
  var array = [];

  for (var key in query){
    array.push({key : key, value : query[key]});
  }


  var sorted = array.sort(querySorter);

  var queryString = "";

  var arr = sorted.map(function (item){
    return [ item.key, item.value].join('=');
  });

  queryString = arr.join('&');

  return queryString;

}





function setDefaults (options){
  var defaults = {
    cacheKey : '{{name}}-{{method}}-{{path}}-{{query}}',
    ttl : 300,
    redis : {

    }
  };


  options = options || {};

  for (var key in defaults){
    if (key in options) continue;

    options[key] = defaults[key];
  }


  return options;

}

function renderCacheKey(template, params){
  return tim(template, params);
}


var restifyCache = function (options) {

  options = setDefaults(options);


  console.log(options);


  return  {
    before : function (req, res, next){
     //console.log(req, req._url.pathname);

      if (!req.route.cache) return next();

      if (typeof req.query === 'function') return next(new errors.InternalServerError('Query not parsed, query parser not called'))

      var availableCacheValues = {
        name : req.serverName,
        path : req._url.pathname,
        query : serializeQuery(req.query),
        headers : req.headers,
        method : req.method,
        query_raw : req.query

      };

      req._inCache = false;


      var cacheKey = renderCacheKey(options.cacheKey, availableCacheValues);

      var caheKeyHash = utils.md5(cacheKey);


      req._restifyCacheKey = caheKeyHash;

      //client.del(caheKeyHash, function (){})

      client.get(caheKeyHash, function (err, response){
        if (err) return next(new errors.InternalServerError('Redis error check logs'));

        if (response) req._inCache = true;

        if (response){

          var object = utils.json.parse(response);

          object._cached = true;

          // just send from cache if in cache
          return res.send(object);
        }

        return next();
      });


    },
    after : function (req, res, next){

      var cacheSettings = req.route.cache;

      //
      if (req._inCache) return next();
      if (!cacheSettings || !req._restifyCacheKey) return next();


      var ttl = options.ttl;

      if (typeof cacheSettings === 'object'){
        ttl = cacheSettings.ttl || ttl;

      }

      if (!isNaN(parseInt(cacheSettings))){
        ttl = parseInt(cacheSettings);
      }


      var payload = req.client._httpMessage._data;

      client.set(req._restifyCacheKey, payload, ttl, function (err, status){
        return next();
      });

    }
  };
} ;


module.exports = restifyCache;
