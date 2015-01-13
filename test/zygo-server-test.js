require('traceur-runtime');

var Zygo = require('../build/zygo-server').default;
var assert = require('chai').assert;

describe("zygo-server tests", function() {
  var zygo;

  before(function(done) {
    zygo = new Zygo('test/zygo.json');
    zygo.initialise().then(done);
  });

  it("Should work", function() {
    console.log(zygo);
  });
});
