require('traceur-runtime');

var Config = require('../build/config').default;
var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');

describe("config.js tests", function() {
  it("correctly expands package path", function() {
    // assert.equal(config.configPath, path.join(__dirname, 'fake-app/zygo.json'));
  });

  describe("parse()", function() {
    before(function(done) {
      done();
      // config.parse().then(done).catch(done);
    });

    it("should load template file", function () {
      // var template = fs.readFileSync(path.join(__dirname, 'fake-app/template.hbs'), "utf-8");
      // assert(config.template, "config has loaded something into config.template");
      // assert.equal(config.template, template,'it is the right something');
    });

    it("should load route files", function() {
    //   var files = {
    //     routes: 'fake-app/routes/routes.json',
    //     clientRoutes: 'fake-app/routes/clientRoutes.json',
    //     serverRoutes: 'fake-app/routes/serverRoutes.json'
    //   };
    //
    //   var key;
    //   for (key in files) files[key] = path.join(__dirname, files[key]);
    //   for (key in files) files[key] = fs.readFileSync(files[key], 'utf-8');
    //   for (key in files) files[key] = JSON.parse(files[key]);
    //
    //   for (key in files) {
    //     assert(config[key], key + " has had something loaded into it by config");
    //     assert.deepEqual(config[key], files[key], key + " is loaded by config correctly");
    //   }
    });
  });
});
