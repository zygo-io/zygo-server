require('traceur-runtime');

var jspm = require('jspm');
var Zygo = require('../build/zygo-server').default;
var assert = require('chai').assert;

describe("zygo-server tests", function() {
  this.timeout(50000);
  var zygo;
  var trace;

  before(function(done) {
    zygo = new Zygo('test/zygo.json');

    zygo.initialise()
      // .then(function() {
      //   return zygo._trace('something');
      // })
      // .then(function(_trace) {
      //   trace = _trace;
      // })
      .then(done)
      .catch(console.log.bind(console));
  });

  it("Should work", function() {
    // Object.keys(trace.tree).map(function(leaf) {
    //   console.log(trace.tree[leaf].name);
    // });
  });
});
