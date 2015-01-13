require('traceur-runtime');

var Zygo = require('../build/zygo-server').default;
var assert = require('chai').assert;

describe("zygo-server tests", function() {
  this.timeout(50000);
  var zygo;

  before(function(done) {
    zygo = new Zygo('test/zygo.json');
    zygo.initialise().then(done).catch(function(error) {
      console.log("oops");
      console.log(error);
    });
  });

  it("Should work", function() {
    console.log(zygo);
  });
});
