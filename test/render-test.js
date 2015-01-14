require('traceur-runtime');

var Zygo = require('../build/zygo-server').default;
var Render = require('../build/render');
var assert = require('chai').assert;

describe("render.js tests", function() {
  this.timeout(50000);
  var zygo;
  var elements;

  before(function(done) {
    zygo = new Zygo('test/fake-app/zygo.json');

    zygo.initialise()
      .then(function() {
        return Render.renderComponent('app/one.jsx!', zygo);
      })

      .then(function(_elements) {
        elements = _elements;
      })

      .then(done)
      .catch(console.error.bind(console));
  });

  it("renders header correctly", function() {
    var header = '<script src="jspm_packages/system.js"></script>\n' +
                           '<script src="config.js"></script>\n' +
                           '<link rel="stylesheet" type="text/css" href="app/two.css"></link>\n' +
                           '<link rel="stylesheet" type="text/css" href="app/one.css"></link>\n';
    assert.equal(elements.zygoHeader, header);
  });

  it("renders footer correctly", function() {
    assert(elements.zygoFooter.match('_setInitialState'), "zygoFooter contains initial state");
    assert(elements.zygoFooter.match('_setRoutes'), "zygoFooter contains routes state");
    assert(elements.zygoFooter.match('_addLinkHandlers'), "zygoFooter sets up link handlerscd");
  });

  it("renders body correctly", function() {
    assert(elements.zygoBody.match("__zygo-body-container__"), "zygoBody contains container div");
    assert(elements.zygoBody.match("One"), "zygoBody contains the right html");
  });
});
