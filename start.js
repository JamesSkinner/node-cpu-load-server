// http://www.acuriousanimal.com/2017/08/12/understanding-the-nodejs-cluster-module.html

const cluster = require('cluster');
const numCPUs = process.env.CLUSTER_COUNT || require('os').cpus().length;

if (cluster.isMaster) {
  masterProcess();
} else {
  childProcess();
}

function masterProcess() {
  console.log(`Master ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    console.log(`Forking process number ${i}...`);
    cluster.fork();
  }
}

function childProcess() {
  require('./server.js')
}
