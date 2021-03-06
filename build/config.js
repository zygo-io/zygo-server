"use strict";
Object.defineProperties(exports, {
  parse: {get: function() {
      return parse;
    }},
  save: {get: function() {
      return save;
    }},
  desugarRoutes: {get: function() {
      return desugarRoutes;
    }},
  __esModule: {value: true}
});
var $__path__,
    $__fs__,
    $__jspm__,
    $__debug__;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var Debug = ($__debug__ = require("./debug"), $__debug__ && $__debug__.__esModule && $__debug__ || {default: $__debug__});
var defaultsDir = path.resolve(__dirname, '../defaults');
var zygoParseSpec = {
  buildDir: {type: 'dir'},
  bundlesJSON: {type: 'json'},
  packageJSON: {
    type: 'path',
    default: 'package.json'
  },
  defaultContext: {default: {}},
  port: {default: 8080},
  anchors: {default: true},
  defaultOptimization: {default: 'tlo'},
  env: {default: 'development'},
  middleware: {default: []},
  template: {
    type: 'file',
    default: path.join(defaultsDir, 'template.hb')
  },
  routes: {
    required: true,
    type: 'json',
    default: './routes.json'
  }
};
var zygoSaveSpec = {};
function parse(configPath) {
  var spec = arguments[1] !== (void 0) ? arguments[1] : zygoParseSpec;
  var result = {};
  var baseDir;
  return resolvePath(configPath, process.cwd()).then((function(resolvedPath) {
    baseDir = path.dirname(resolvedPath);
    result.path = resolvedPath;
    return getFile(resolvedPath);
  })).then(JSON.parse).then((function(json) {
    return Promise.all(Object.keys(spec).map((function(key) {
      return parseConfigObject(key, spec[key], json, result, baseDir);
    }))).then((function() {
      Object.keys(json).map((function(key) {
        if (!result[key])
          result[key] = json[key];
      }));
    }));
  })).then((function() {
    return result;
  })).catch(Debug.propagate("Error parsing zygo.json: "));
}
function parseConfigObject(name, config, json, result, baseDir) {
  var value = json[name];
  if (!value && config.default) {
    if (Debug.mode.debugMode)
      console.log("No config for " + name + ", reverting to default: " + config.default);
    value = config.default;
  }
  if (!value) {
    if (config.required)
      throw new Error("Error: config does not contain a value for " + name);
    return;
  }
  if (!config.type)
    return Promise.resolve().then((function() {
      return result[name] = value;
    }));
  if (config.type === 'path')
    return resolvePath(value, baseDir).then((function(path) {
      return result[name] = path;
    })).catch(error(name, "problem resolving path: " + value));
  if (config.type === 'dir')
    return resolveDir(value, baseDir).then((function(path) {
      return result[name] = path;
    })).catch(error(name, "couldn't stat or create directory: " + value));
  if (config.type === 'file')
    return resolvePath(value, baseDir).then(getFile).then((function(data) {
      return result[name] = data;
    })).catch(error(name, "problem loading file: " + value));
  if (config.type === 'json')
    return resolvePath(value, baseDir).then(getFile).then(JSON.parse).then((function(data) {
      return result[name] = data;
    })).catch(error(name, "problem loading json: " + value));
}
function save(config) {
  var spec = arguments[1] !== (void 0) ? arguments[1] : zygoSaveSpec;
  return getFile(config.path).then(JSON.parse).then((function(json) {
    Object.keys(spec).map((function(key) {
      if (spec[key].type && spec[key].type === 'json')
        return;
      if (spec[key].type && spec[key].type === 'file')
        return;
      if (spec[key].type && spec[key].type === 'delete')
        return delete json[key];
      var value = config[key];
      if (value) {
        if (spec[key].type && spec[key].type === 'path')
          value = path.relative(path.dirname(config.path), value);
        json[key] = value;
      }
    }));
    return json;
  })).then((function(json) {
    return new Promise((function(resolve, reject) {
      fs.writeFile(config.path, JSON.stringify(json, null, 2), function(error) {
        if (error)
          return reject(error);
        return resolve();
      });
    }));
  })).catch(Debug.propagate("Error saving config: "));
}
function error(name, msg) {
  return (function() {
    throw new Error("Error loading " + name + " in config - " + msg);
  });
}
function resolveDir(url, relativeTo) {
  return new Promise((function(resolve, reject) {
    resolvePath(url, relativeTo).then((function(path) {
      return resolve(path);
    })).catch((function(error) {
      console.log("Can't stat dir " + url + ", creating it.");
      var dirs = url.split(path.sep);
      dirs.reduce((function(chain, dir, i) {
        return chain.then((function() {
          return new Promise((function(resolve, reject) {
            fs.mkdir(path.resolve(relativeTo, dirs.slice(0, i + 1).join(path.sep)), resolve);
          }));
        }));
      }), Promise.resolve()).then((function() {
        return resolve(resolvePath(url, relativeTo));
      })).catch(reject);
    }));
  })).catch(Debug.propagate("Error resolving dir in config: "));
}
function resolvePath(url, relativeTo) {
  var attempt = path.resolve(relativeTo, url);
  return new Promise((function(resolve, reject) {
    fs.stat(attempt, (function(error) {
      if (!error)
        return resolve(attempt);
      attempt = path.resolve(url);
      fs.stat(attempt, (function(error) {
        if (error)
          return reject(error);
        return resolve(attempt);
      }));
    }));
  })).catch(Debug.propagate("Error resolving path in config: "));
}
function getFile(file) {
  return new Promise((function(resolve, reject) {
    fs.readFile(file, "utf-8", (function(error, data) {
      if (error)
        return reject(error);
      else
        return resolve(data);
    }));
  })).catch(Debug.propagate("Error getting file in config: "));
}
function desugarRoutes(route) {
  var parent = arguments[1] !== (void 0) ? arguments[1] : null;
  var result = {};
  return Promise.all(Object.keys(route).map((function(key) {
    return desugarKeyValue(key, route[key], parent).then((function(desugaredRoute) {
      return result[key] = desugaredRoute;
    }));
  }))).then((function() {
    return flattenMixins(result);
  }));
}
function desugarKeyValue(key, value, parent) {
  if (key === "mixin")
    return handleMixins(key, value);
  if (key === "component")
    return handleString(key, value);
  if (key !== "default" && key[0] !== "/")
    throw new Error("Invalid route key: " + key);
  if (!(value instanceof Array))
    value = [value];
  return Promise.all(value.map((function(val) {
    if (typeof val === "string")
      return handleString(key, val);
    return desugarRoutes(val, parent);
  })));
  function handleMixins(key, value) {
    if (typeof value === "string")
      value = [value];
    return Promise.all(value.map((function(modulePath) {
      return handleModule(modulePath);
    })));
  }
  function handleString(key, value) {
    if (key[0] === '/')
      return handleModule(value);
    if (key === "default")
      return handleModule(value);
    return handleComponent(value);
  }
  function handleComponent(value) {
    return jspm.normalize(value, parent);
  }
  function handleModule(value) {
    return jspm.normalize(value, parent).then((function(jspmPath) {
      return jspm.locate(value, parent).then((function(nodePath) {
        if (nodePath.match(/\.json\.js$/)) {
          nodePath = nodePath.replace(".json.js", ".json");
          var result = require(nodePath);
          return desugarRoutes(result, jspmPath);
        } else
          return handleComponent(value).then((function(modulePath) {
            return {component: modulePath};
          }));
      }));
    }));
  }
}
function flattenMixins(route) {
  var result = {};
  Object.keys(route).map((function(key) {
    if (key === 'mixin') {
      route[key].map((function(mixin) {
        Object.keys(mixin).map((function(innerKey) {
          if (!result[innerKey])
            result[innerKey] = mixin[innerKey];
        }));
      }));
    } else {
      result[key] = route[key];
    }
  }));
  return result;
}
//# sourceURL=config.js