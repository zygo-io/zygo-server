require('traceur-runtime');

var Zygo = require('../build/zygo-server').default;
var assert = require('chai').assert;

describe("zygo-server tests", function() {
  this.timeout(50000);
  var zygo;
  var cssTrace;

  before(function(done) {
    zygo = new Zygo('test/fake-app/zygo.json');

    zygo.initialise()
      .then(function() {
        return zygo._cssTrace('app/one.jsx!');
      })
      .then(function(_cssTrace) {
        cssTrace = _cssTrace;
      })
      .then(done)
      .catch(console.error.bind(console));
  });

  describe("_cssTrace()", function() {
    it("Should have two dependencies in the cssTrace", function() {
      assert.equal(cssTrace.length, 2);
    });

    it("Should have the right dependencies in the cssTrace", function() {
      var deps = {};
      cssTrace.map(function(css) { deps[css] = true; });

      assert(deps['app/one.css'] && deps['app/two.css']);
    });
  });
});
