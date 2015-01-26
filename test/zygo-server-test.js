require('traceur-runtime');

var Zygo = require('../build/zygo-server').default;
var assert = require('chai').assert;
var zygo;

describe("zygo-server.js tests", function() {
  this.timeout(5000);

  before(function(done) {
    zygo = new Zygo('test/fake-app/zygo.json');
    zygo.initialize().then(done).catch(console.log.bind(console));
  });

  it("Renders route correctly", function(done) {
    zygo.route('/one', {header: 'header'}, 'GET')
      .then(function(html) {
        assert(!!html);
        assert.match(html, /one.css/);
        assert.match(html, /two.css/);
        done();
      })
      .catch(function(error) { console.log(error.stack); });
  });
});
