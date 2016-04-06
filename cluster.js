var cluster = require('cluster');
var os = require('os');
if(cluster.isMaster){
  var cpuCount = os.cpus().length;

  for (var i = 0; i < cpuCount; i+=1){
    cluster.fork();
  }

  cluster.on('exit', function(){
    cluster.fork();
  });

}else{
  require('./server');
}
