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
    var baseDir = path.dirname(this.configPath);
    this.config = this._getJSONFile(this.configPath);
    this.template = this._getFile(this.config.template, baseDir);
    var self = this;
    ['routes', 'clientRoutes', 'serverRoutes'].map(function(route) {
      self[route] = self._getJSONFile(self.config[route], baseDir);
    });
  },
  _getFile: function(file, relativeTo) {
    if (relativeTo) {
      try {
        return fs.readFileSync(path.join(relativeTo, file), "utf-8");
      } catch (_) {}
    }
    return fs.readFileSync(file, "utf-8");
  },
  _getJSONFile: function(file, relativeTo) {
    return JSON.parse(this._getFile(file, relativeTo));
  }
}, {});
var $__default = Config;
//# sourceURL=config.js