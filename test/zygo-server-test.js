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
      .then(function() { return zygo._cssTrace('app/one.jsx!'); })
      .then(function(_cssTrace) { cssTrace = _cssTrace; })
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

  describe("route()", function() {
    var html;

    before(function(done) {
      zygo.route('/one')
        .then(function(_html) { html = _html; })
        .then(done)
        .catch(console.error.bind(console));
    });

    it("renders html correctly", function() {
      //Heuristic test. ^_^ TODO
      assert(html.match("_setInitialState"), "set initial state is present in html");
      assert(html.match("_setRoutes"), "set routes is present in html");
      assert(html.match("_addLinkHandlers"), "set link handlers state is present in html");
    });
  });

  describe("route() with default", function() {
    var html;

    before(function(done) {
      zygo.route('/does/not/match/any/route')
      .then(function(_html) { html = _html; })
      .then(done)
      .catch(console.error.bind(console));
    });

    it("renders html correctly", function() {
      assert(html.match("_setInitialState"), "set initial state is present in html");
      assert(html.match("_setRoutes"), "set routes is present in html");
      assert(html.match("_addLinkHandlers"), "set link handlers state is present in html");
    });
  });
});
