

// var image = require('./lib/search.js');
// var exif = require('exifjs');

var config = require('./config.js');

var server = require('./lib/server.js');


server.listen(3000, function (){
  console.log('Started on port 3000')
})


// image.config = config;
//
// exif.setup.exiftool=config.exiftool;
