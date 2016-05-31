


var restify = require('restify');

var config = require('./../config.js');
var restify_modules = require('./api/restify-handlers.js');
var bunyan = require('bunyan');
// var api = require('./api/api.js');

var routes = require('./api/routes.js');
// var DEFAULT_VERSION = config.default_version;
var server = restify.createServer(config.logging);


var log = bunyan.createLogger({name: config.name});

var restifyCache= require('./api/restifycache.js');

var cache = restifyCache({

   cacheKey : '{{name}}-{{method}}-{{path}}-{{query}}',
   redis : {

   },


 });


// // Checks version in url
// server.pre(ParseVersion);

// Parse query params.
server.use(restify.queryParser({ mapParams: false }));

// Authenticaiton module
server.use(restify_modules.authentication);


// Add logging to requests
server.use(restify.requestLogger());

// Cors settings
server.use(restify.CORS());

// Parse form post ex.
server.use(restify.bodyParser());

// Do cache in the end


server.use(function (req, res, next){
  res.charSet('utf-8');
  return next();
});

if (config.redis.enabled){
  console.log('Cache is enabled');
  server.use(cache.before);
  server.on('after', cache.after);
}

if (process.env.PRODUCTION){
  // Create logger for reqeusts
  server.on('after', restify.auditLogger({
    log: log
  }));
}


server = routes(server);

module.exports = server;
