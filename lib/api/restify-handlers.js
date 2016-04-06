  'use strict'
var semver = require('semver');

var handlers = {
  authentication : function (res, req, next){
    return next();
  }
};



module.exports = handlers;
