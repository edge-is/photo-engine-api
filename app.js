

// var image = require('./lib/search.js');
// var exif = require('exifjs');

var config = require('./config.js');


var port = process.env.PORT || 3000;


var server = require('./lib/server.js');


server.listen(port, function (){
  console.log('Started on port 3000')
})


process.on('SIGTERM', function () {
  if (server === undefined) return;
  server.close(function () {
    // Disconnect from cluster master
    process.disconnect && process.disconnect();
  });
});




// image.config = config;
//
// exif.setup.exiftool=config.exiftool;
