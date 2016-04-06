/**
 * Routing starts here
 */

var api = require('./api.js');


module.exports = function (server){
  server.get ({ path : '/api/search/query' }, api.queryStringSearch);
  server.get ({ path : '/api/search/filter' }, api.filterSearch);
  server.get ({ path : '/api/search/typeahead' }, api.typeahead);
  server.get ({ path : '/api/mapping' }, api.mapping);

  server.post({ path : '/api/search/advanced' }, api.advancedSearch);

  return server;
}
