"use strict";
Object.defineProperties(exports, {
  build: {get: function() {
      return build;
    }},
  unbuild: {get: function() {
      return unbuild;
    }},
  __esModule: {value: true}
});
var $__systemjs_45_basic_45_optimize__,
    $__systemjs_45_builder__,
    $__jspm__,
    $__path__,
    $__fs__,
    $__crypto__,
    $__config__,
    $__debug__;
var optimize = ($__systemjs_45_basic_45_optimize__ = require("systemjs-basic-optimize"), $__systemjs_45_basic_45_optimize__ && $__systemjs_45_basic_45_optimize__.__esModule && $__systemjs_45_basic_45_optimize__ || {default: $__systemjs_45_basic_45_optimize__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var crypto = ($__crypto__ = require("crypto"), $__crypto__ && $__crypto__.__esModule && $__crypto__ || {default: $__crypto__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__});
var Debug = ($__debug__ = require("./debug"), $__debug__ && $__debug__.__esModule && $__debug__ || {default: $__debug__});
function build(zygo) {
  return getPageObjects(zygo.routes).then(optimize).then((function(bundles) {
    return _build(bundles, zygo);
  })).catch(Debug.propagate("Error building bundles: "));
}
function _build(bundles, zygo) {
  if (!zygo.config.buildDir)
    throw new Error("buildDir has not been set in zygo.json.");
  var bundlesJSON = {};
  return Promise.all(bundles.map((function(bundle) {
    var bundleHash = crypto.createHash('md5');
    Object.keys(bundle.tree).map((function(key) {
      return bundleHash.update(bundle.tree[key].source);
    }));
    bundleHash = bundleHash.digest('hex');
    var bundlePath = path.relative(zygo.baseURL, path.join(zygo.config.buildDir, bundleHash));
    var filePath = path.join(zygo.baseURL, bundlePath) + '.js';
    return builder.buildTree(bundle.tree, filePath).then((function() {
      bundlesJSON[bundlePath] = {
        routes: bundle.routes,
        modules: Object.keys(bundle.tree)
      };
    }));
  }))).then((function() {
    return new Promise((function(resolve, reject) {
      var bundlesPath = path.join(zygo.config.buildDir, 'bundles.json');
      fs.writeFile(bundlesPath, JSON.stringify(bundlesJSON), (function(error) {
        if (error)
          return reject(error);
        zygo.config.bundlesJSON = bundlesPath;
        return resolve(Config.save(zygo.config, {bundlesJSON: {type: 'path'}}));
      }));
    }));
  }));
}
function unbuild(zygo) {
  return Config.save(zygo.config, {bundlesJSON: {type: 'delete'}}).then((function() {
    return new Promise((function(resolve, reject) {
      if (!zygo.config.buildDir)
        return resolve();
      fs.readdir(zygo.config.buildDir, (function(error, files) {
        if (error)
          return resolve();
        return resolve(Promise.all(files.map((function(file) {
          return fs.unlink(path.resolve(zygo.config.buildDir, file));
        }))));
      }));
    }));
  }));
}
function getPageObjects(routes) {
  var pages = {};
  return traverse(routes, '', (function(path, route) {
    return Promise.resolve().then((function() {
      return route.component ? jspm.import(route.component) : null;
    })).then((function(module) {
      pages[path] = [];
      if (route.component)
        pages[path].push(route.component);
      if (module && module.default.clientHandler)
        pages[path].push(module.default.clientHandler);
      else if (module && module.default.handler)
        pages[path].push(module.default.handler);
      return Promise.all(pages[path].map((function(modulePath) {
        return jspm.normalize(modulePath, route.component).then((function(modulePath) {
          return builder.trace(modulePath);
        })).then((function(trace) {
          var result = {
            moduleName: trace.moduleName,
            tree: []
          };
          Object.keys(trace.tree).filter((function(key) {
            var record = trace.tree[key];
            return !((record.metadata.build && record.metadata.build === false) || (record.metadata.plugin && record.metadata.plugin.build === false));
          })).map((function(key) {
            return result.tree[key] = trace.tree[key];
          }));
          return result;
        }));
      }))).then((function(tree) {
        return pages[path] = tree;
      }));
    }));
  })).then((function() {
    return pages;
  })).catch(Debug.propagate("Error in getPageObjects(): "));
}
function traverse(route, path, callback) {
  return callback(path, route).then((function() {
    return Promise.all(Object.keys(route).filter((function(key) {
      return key[0] === '/';
    })).map((function(key) {
      return traverse(route[key], path + key, callback);
    })));
  })).catch(Debug.propagate("Error traversing routes: "));
}
//# sourceURL=build.js