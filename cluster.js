// var cluster = require('cluster');
// var os = require('os');
//
//
// var config = require('./config');
//
//
// if (cluster.isMaster){
//   return require('./lib/master.js');
// }
//
// var workers = config.workers || 'auto';
//
// if (workers === 'auto'){
//   workers = os.cpus().length;
// }
//
//
// console.log('Workers', workers)
//
//
// if(cluster.isMaster){
//
//   for (var i = 0; i < workers; i+=1){
//     cluster.fork();
//   }
//
//   cluster.on('exit', function(){
//     cluster.fork();
//   });
//
// }else{
//   require('./app');
// }


/**
 * bin/node-simple-http-daemon
 */

// Everything above this line will be executed twice
//require('daemon')();

var cluster = require('cluster');

var config = require('./config.js');


var workers = config.workers || 'auto';

if (workers === 'auto'){
  workers = require('os').cpus().length;
}
// Number of CPUs

/**
 * Creates a new worker when running as cluster master.
 * Runs the HTTP server otherwise.
 */
function createWorker() {
  if (cluster.isMaster) {
    // Fork a worker if running as cluster master
    var child = cluster.fork();

    console.log(child.process.pid);

    // Respawn the child process after exit
    // (ex. in case of an uncaught exception)
    child.on('exit', function (code, signal) {
      createWorker();
    });
  } else {
    // Run the HTTP server if running as worker
    require('./app.js');
  }
}

/**
 * Creates the specified number of workers.
 * @param  {Number} n Number of workers to create.
 */
function createWorkers(n) {
  while (n-- > 0) {
    createWorker();
  }
}


/**
 * Kills all workers with the given signal.
 * Also removes all event listeners from workers before sending the signal
 * to prevent respawning.
 * @param  {Number} signal
 */
function killAllWorkers(signal) {
  var uniqueID,
      worker;

  for (uniqueID in cluster.workers) {
    if (cluster.workers.hasOwnProperty(uniqueID)) {
      worker = cluster.workers[uniqueID];
      worker.removeAllListeners();
      worker.process.kill(signal);
    }
  }
}

/**
 * Restarts the workers.
 */
process.on('SIGHUP', function () {
  killAllWorkers('SIGTERM');
  createWorkers(workers);
});

/**
 * Gracefully Shuts down the workers.
 */
process.on('SIGTERM', function () {
  killAllWorkers('SIGTERM');
});


// Create two children for each CPU
createWorkers(workers);
