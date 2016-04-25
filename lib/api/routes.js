/**
 * Routing starts here
 */

var api = require('./api.js');


module.exports = function (server){
  server.get ({ cache: true, path : '/api/search/query' }, api.queryStringSearch);
  server.get ({ cache: true, path : '/api/search/filter' }, api.filterSearch);
  server.get ({ cache: true, path : '/api/search/typeahead' }, api.typeahead);
  server.get ({ cache: true, path : '/api/search/suggest/:type' }, api.suggest);
  server.get ({ cache: true, path : '/api/mapping' }, api.mapping);
  server.get ({ cache: true, path : '/api/image/:id' }, api.image);
  server.get ({ cache: { ttl : 50}, path : '/api/aggregates/:key' }, api.aggregate);
  server.get ({ cache: true, path : '/api/random/archives' }, api.randomImagesByArchiveID);


  server.post({ path : '/api/search/advanced' }, api.advancedSearch);

  return server;
}
