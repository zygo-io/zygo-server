require('traceur-runtime');

var Zygo = require('../build/zygo-server').default;
var Build = require('../build/build');
var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');

describe("build.js tests", function() {
  this.timeout(5000);

  before(function(done) {
    zygo = new Zygo('test/fake-app/zygo.json');
    zygo.initialize().then(done).catch(console.log.bind(console));
  });

  after(function(done) {
    fs.readdir(path.join(__dirname, 'fake-app/build'), function(error, files) {
      files.map(function(file) {
        fs.unlinkSync(path.join(__dirname, 'fake-app/build', file));
      });
      fs.writeFileSync(path.join(__dirname, 'fake-app/build/bundles.json'), '{}');

      done();
    });
  });

  it("builds correctly", function(done) {
    zygo.build().then(function() {
      fs.readdir(path.join(__dirname, 'fake-app/build'), function(error, files) {
        assert(!error);
        assert(files.length > 1);

        done();
      });
    }).catch(function(error) { console.log(error.stack); });
  });
});
