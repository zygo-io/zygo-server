"use strict";
Object.defineProperties(exports, {
  parse: {get: function() {
      return parse;
    }},
  __esModule: {value: true}
});
var $__path__,
    $__fs__;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var defaultsDir = path.resolve(__dirname, '../defaults');
var zygoSpec = {
  buildDir: {},
  packageJSON: {default: 'package.json'},
  port: {default: 8080},
  anchors: {default: true},
  template: {
    type: 'file',
    default: path.join(defaultsDir, 'template.hb')
  },
  routes: {
    type: 'json',
    default: path.join(defaultsDir, 'routes.json')
  },
  clientRoutes: {
    type: 'json',
    default: path.join(defaultsDir, 'routes.json')
  },
  serverRoutes: {
    type: 'json',
    default: path.join(defaultsDir, 'routes.json')
  }
};
function parse(configPath) {
  var spec = arguments[1] !== (void 0) ? arguments[1] : zygoSpec;
  var baseDir = path.dirname(configPath);
  var result = {};
  return getFile(configPath).then((function(data) {
    return JSON.parse(data);
  })).then((function(json) {
    return Promise.all(Object.keys(spec).map((function(key) {
      return parseConfigObject(key, spec[key], json);
    })));
  })).then((function() {
    return result;
  }));
  function parseConfigObject(name, config, json) {
    var value = json[name] || config.default;
    if (!value) {
      if (config.required)
        throw new Error("Error: config does not contain a value for " + name);
    }
    if (!config.type)
      return Promise.resolve().then((function() {
        return result[name] = value;
      }));
    if (config.type === 'file')
      return getFile(value, baseDir).then((function(data) {
        return result[name] = data;
      }));
    if (config.type === 'json')
      return getFile(value, baseDir).then((function(data) {
        return JSON.parse(data);
      })).then((function(data) {
        return result[name] = data;
      }));
  }
}
function getFile(file) {
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
}
//# sourceURL=config.js