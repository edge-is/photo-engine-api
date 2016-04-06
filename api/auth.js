
var errors = require('restify-errors');

function SelectFromDBbyToken(token, callback){
  callback(null, {
    token : token,
    domains : [
      'localhost:3000'
    ]
  });
}

var auth = {
  authenticate : function (domain, token, callback){
    SelectFromDBbyToken(token, function (err, resp){
      if(err) callback(err);
      if(resp.domains.indexOf(domain) > -1){
        callback(null);
      }else{
        callback('Token not valid for resource');
      }

    });

  },
  getToken : function (domain, callback){

  },
  server : function (req, res, next){
    var _root = this;

    if(req.route.AuthenticationRequired === true){
      var AuthHeader = req.headers.authorization;
      if(!AuthHeader){
          return next(new errors.UnauthorizedError ("No token sent"));
      }
      if(AuthHeader.indexOf('=') === -1){
        return next(new errors.UnauthorizedError ("Error parsing header"));
      }

      var token = AuthHeader.split("=")[1].replace(/"/g, '');
      var host = req.headers.host;
      auth.authenticate(host, token, function (err, data){
        if(err){
          return next(new errors.UnauthorizedError (err));
        }
      });
    }

    next();
  }
};

module.exports=auth;
