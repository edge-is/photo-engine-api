var request = require('request');

var errors = require('restify-errors');

function parseElasticsearch(response){
  try {
    return JSON.parse(response);
  } catch (e) {
    return response;
  }
}


var esProxy = {
  get : function (req, res, next){


    var requestedURI = req.url.split('es/').pop();

    var uri = `http://localhost:9200/${requestedURI}`;

    request({
      uri : uri,
      method : 'GET'
    }, function (error, response){
      if (error) return next(new errors.InternalError({
            message: JSON.stringify(response)
      }));

      res.send(parseElasticsearch(response.body));

    });

  },
  post : function (req, res, next){
     var allow = ['_count', '_msearch', '_search'];

     if (allow.indexOf(req.params.action) === -1){
       return next(new errors.ForbiddenError({
             message: `${req.params.action} is not allowed`
       }));
     }

     var requestedURI = req.url.split('api/es/').pop();
     var uri = `http://localhost:9200/${requestedURI}`;

     request({
       uri : uri,
       method : 'POST',
       json : req.body
     }, function (error, response){
         console.log(error);
       if (error) return new errors.InternalError({
             message: JSON.stringify(response)
       });
       res.send(parseElasticsearch(response.body));
     });
   }

}




module.exports = esProxy;
