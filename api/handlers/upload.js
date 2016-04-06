var s3 = require('s3');
var fs = require('fs');
md5 = require('md5-jkmyers')
var exif = require(global.APP_ROOT + '/lib/exif.js');
var errors = require('restify-errors');
//var redis = require('redis');
var MQ = require(global.APP_ROOT + '/lib/redismq');
var log = global.LOG;
var config = global.APP_CONFIG;


var message_queue = config.redis.message_queue;
var Q= new MQ(message_queue);

var client = s3.createClient({
  maxAsyncS3: 20,     // this is the default
  s3RetryCount: 3,    // this is the default
  s3RetryDelay: 1000, // this is the default
  multipartUploadThreshold: 20971520, // this is the default (20 MB)
  multipartUploadSize: 15728640, // this is the default (15 MB)
  s3Options: config.objectStore.authentication
});



var upload = function (req, res, next){
  var i, params, fileID, file, base64, path;
  var folder = req.params.folder;
  for (i in req.files){
    file = req.files[i];
    if(typeof file == 'object'){
      path = folder + '/' +file.name;
      fileID = md5(path);
      base64 = new Buffer(path).toString('base64');
      exif(file.path, { FileName : file.name, Directory : folder, Folder_Filename : base64 },  function (err, json, localFilePath){
        // Next ... upload to amazon
        log.info('Starting upload to amazon ' + localFilePath);
        params = {
          LocalFile : localFilePath,
          // need logic here...
          bucket : 'myndasofn',
          fileName : fileID
        };
        UploadToObjectStore(params, function (err, response){
          if(err) {}
          res.send(response);
        });
      });
      //fileID = md5('hello, world!')

      //console.log('FileID', fileID);
      // params = {
      //   localFile : req.files[file].path
      //
      // };

    }

  }


  next();
};

var UploadToObjectStore = function (params, callback){
  log.info('Starting S3 upload...');
  var ObjectStorageParams = {
    localFile: params.LocalFile,
    s3Params: {
      Bucket: params.bucket,
      Key: params.fileName
    }
  };

  var uploader = client.uploadFile(ObjectStorageParams);
  uploader.on('error', function(err) {
    log.error("unable to upload:", err.stack);
    fs.unlink(ObjectStorageParams.LocalFile, function (err) {
      if (err) console.log(err);
      log.info('successfully deleted');
    });
  });

  uploader.on('end', function(md5) {
    log.info("done uploading " + ObjectStorageParams.localFile);

    NotifyWorkers(params);

    // Notify Scaling servers to fetch the image from amazon and create copy's

    // just delete the file, not used anymore..
    fs.unlinkSync(ObjectStorageParams.localFile);

    callback(null, { status : 'uploaded' });

  });
};

function NotifyWorkers(params){

  var client = Q.connect();
  log.info('Connected to REDIS');
  delete params.LocalFile;

  Q.add(params, function (err, resp){
    console.log(err, resp);
    if(err){
      log.error(err);
      return;
    }
    log.info('Added to REDIS worker queue ID:' + resp.ID);
    log.info('Sending message to REDIS channel:' + message_queue );
    client.publish(message_queue, JSON.stringify(params));
    client.end();
  });
};


module.exports = upload;
