


var restify = require('restify');

var config = require('./../config.js');
var restify_modules = require('./api/restify-handlers.js');
var bunyan = require('bunyan');
// var api = require('./api/api.js');

var routes = require('./api/routes.js');
// var DEFAULT_VERSION = config.default_version;
var server = restify.createServer({
  name: config.name
  // ,
  // versions: [DEFAULT_VERSION, '2.0.0']
});


var log = bunyan.createLogger({name: config.name});




// // Checks version in url
// server.pre(ParseVersion);

// Authenticaiton module
server.use(restify_modules.authentication);

// Add logging to requests
server.use(restify.requestLogger());

// Cors settings
server.use(restify.CORS());

// Parse form post ex.
server.use(restify.bodyParser());

// Parse query params.
server.use(restify.queryParser({ mapParams: false }));

server.use(function (req, res, next){
  res.charSet('utf-8');
  return next();
});

// Create logger for reqeusts
// server.on('after', restify.auditLogger({
//   log: log
// }));

server = routes(server);

module.exports = server;
