/**
 * Routes.js
 *
 * Adds routes to applications and handles that
 * Most routes goes to the API if api specific /api ex
 */
var config = global.APP_CONFIG;
var log = global.LOG;


var restify = require('restify');
var api = require('./api.js');
var authentication = require('./auth.js');

var cors = require('./cors.js');


var DEFAULT_VERSION = config.default_version;
var server = restify.createServer({
  name: config.name,
  versions: [DEFAULT_VERSION, '2.0.0']
});


module.exports=server;
var ParseVersion = require('./versions.js');

// Checks version in url
server.pre(ParseVersion);

// Authenticaiton module
server.use(authentication.server);

// Add logging to requests
server.use(restify.requestLogger());

// Cors settings
server.use(cors);

// Parse form post ex.
server.use(restify.bodyParser());

// Parse query params.
server.use(restify.queryParser({ mapParams: false }));

// Create logger for reqeusts
// server.on('after', restify.auditLogger({
//   log: log
// }));

/**
 * Routing starts here
 */
server.get ({ path : '/api/search/:type', version : DEFAULT_VERSION }, api.search);
server.get ({ path : '/api/mapping', version : DEFAULT_VERSION }, api.mapping);

//server.post({ path : '/api/search/advanced', version : DEFAULT_VERSION }, api.advancedSearch);

server.put({ path : '/api/image/:folder', version : DEFAULT_VERSION }, api.image.upload);
