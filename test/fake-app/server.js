var Zygo = require('../../build/zygo-server').default;

var zygo = new Zygo('zygo.json');
zygo.initialize().then(function() {
  zygo.createServer();
});
