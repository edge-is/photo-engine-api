'use strict'
var semver = require('semver');
var server = module.parent.exports;

var DEFAULT_VERSION = global.APP_CONFIG.default_version;


module.exports = function (req, res, next) {
    var version;
    // Set charSet to utf-8
    res.charSet('utf-8');
    // Remove first '/' in URL
    var workingUrl = req.url.substring(1, req.url.length);

    if(workingUrl.indexOf('/') === -1){
      req.headers['accept-version'] = DEFAULT_VERSION;
      return next();
    }

    // Get second string from url
    var urlApiVersion = workingUrl.split('/')[1];

    // Changes version to x.x.x format
    if (!semver.valid(urlApiVersion)) {
        version = urlApiVersion.replace(/v(\d{1})\.(\d{1})\.(\d{1})/, '$1.$2.$3');
        version = version.replace(/v(\d{1})\.(\d{1})/, '$1.$2.0');
        version = version.replace(/v(\d{1})/, '$1.0.0');
    }

    // checks if version is valid, and then replaces the url with nothing
    if (semver.valid(version) && server.versions.indexOf(version) > -1) {
        req.url = req.url.replace(urlApiVersion + '/', '');
        req.headers['accept-version'] = version;
    }

    // Pass on Next function
    return next();
};
