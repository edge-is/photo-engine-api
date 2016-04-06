var exif = require('exifjs');
var config = global.APP_CONFIG;
exif.setup.exiftool = config.exiftool;

var toDelete = ['Directory', 'SourceFile'];

module.exports = function (file, params, callback){
  if(!params) {
    params = {};
  }
  exif.get(file, function (err, json){
    json = json[0];
    for (var i = 0; i < toDelete.length; i++){
      var d = toDelete[i];
      console.log(d, json[d]);
      delete json[d];
    }

    // params to add or override;
    for (var p in params){
      json[p] = params[p];
    }

    callback(null, json, file);
  });
};
