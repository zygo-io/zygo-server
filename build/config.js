"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $__path__,
    $__fs__;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var Config = function Config(configFile) {
  this.configPath = path.resolve(configFile);
};
($traceurRuntime.createClass)(Config, {
  parse: function() {
    var $__2 = this;
    var baseDir = path.dirname(this.configPath);
    return this._getFile(this.configPath).then((function(config) {
      $__2.config = JSON.parse(config);
      $__2.packageJSON = $__2.config.packageJSON;
      var filePaths = ['template', 'routes', 'clientRoutes', 'serverRoutes'].map((function(name) {
        return $__2.config[name];
      }));
      if (!filePaths[0])
        filePaths[0] = path.resolve(__dirname, '../defaults/template.hb');
      return $__2._getFiles(filePaths, baseDir);
    })).then((function(files) {
      $__2.template = files[0];
      $__2.routes = JSON.parse(files[1]);
      $__2.clientRoutes = JSON.parse(files[2]);
      $__2.serverRoutes = JSON.parse(files[3]);
    }));
  },
  _getFile: function(file) {
    var relativeTo = arguments[1] !== (void 0) ? arguments[1] : '';
    return new Promise((function(resolve, reject) {
      fs.readFile(path.join(relativeTo, file), "utf-8", (function(error, data) {
        if (!error)
          return resolve(data);
        fs.readFile(file, "utf-8", (function(error, data) {
          if (error)
            return reject(error);
          else
            return resolve(data);
        }));
      }));
    }));
  },
  _getFiles: function(files) {
    var relativeTo = arguments[1] !== (void 0) ? arguments[1] : '';
    var $__2 = this;
    return new Promise((function(resolve, reject) {
      var results = [],
          finished = 0;
      files.map((function(file, i) {
        $__2._getFile(file, relativeTo).then((function(file) {
          results[i] = file;
          if (++finished == files.length)
            return resolve(results);
        })).catch((function(error) {
          return reject(error);
        }));
      }));
    }));
  }
}, {});
var $__default = Config;
//# sourceURL=config.js