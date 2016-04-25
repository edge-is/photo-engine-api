

// var redis = require("redis"),
//     client = redis.createClient({
//       detect_buffers : true
//     });
//
var Redis = require('ioredis');
var redis = new Redis();



var zlib = require('zlib');
var gzip = zlib.createGzip();

var utils = require('./utils.js');


var redisCache = function (options){


  opions = options || {};

  options.compression = options.compression || 'gzip';

  options.minSize = options.minSize || 150;


  return {
    get : function (key, callback){
      redis.get(key, function (err, response){
        if (err) return callback(err);

        if (!response) return callback(err, response);


        var object = utils.json.parse(response);


        if (!object.compression) {
          return callback(err, object.data);
          // deal with compression
        }


        var buffer = new Buffer(object.data.data);


        if (object.compression === 'gzip'){
          return zlib.gunzip(buffer, function (err, unzipped){
            var string = unzipped.toString('utf8');
            return callback(err, string);
          });
        }


      });

    },
    del : function (key, callback){
      redis.del(key, callback);
    },
    set : function (key, payload, ttl, callback){

      if (!options.compression) return redis.set(kay, { compression:false, data : payload }, ttl, callback);

      var data = {
        compression : options.compression,
        data : payload
      }

      if (payload.length < options.minSize){
        return redis.set(key, { compression : false, data : payload }, ttl, callback);
      }
      
      var buffer = new Buffer(data.data, 'utf-8');

      zlib.gzip(buffer, function (err, gzipped) {
        data.data = gzipped;
        redis.set(key, JSON.stringify(data));
        return redis.expire(key, ttl, callback);
      });
    }
  }
}


module.exports = redisCache;
