"use strict";
Object.defineProperties(exports, {
  build: {get: function() {
      return build;
    }},
  __esModule: {value: true}
});
var $__systemjs_45_basic_45_optimize__,
    $__systemjs_45_builder__,
    $__jspm__,
    $__path__,
    $__fs__,
    $__crypto__,
    $__config__;
var optimize = ($__systemjs_45_basic_45_optimize__ = require("systemjs-basic-optimize"), $__systemjs_45_basic_45_optimize__ && $__systemjs_45_basic_45_optimize__.__esModule && $__systemjs_45_basic_45_optimize__ || {default: $__systemjs_45_basic_45_optimize__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var crypto = ($__crypto__ = require("crypto"), $__crypto__ && $__crypto__.__esModule && $__crypto__ || {default: $__crypto__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__});
function build(zygo) {
  return getPageObjects(zygo.config.routes).then(optimize).then((function(bundles) {
    return _build(bundles, zygo);
  }));
}
function _build(bundles, zygo) {
  if (!zygo.config.buildDir)
    throw new Error("buildDir has not been set in zygo.json.");
  var bundlesJSON = {};
  bundles.map((function(bundle) {
    var bundleHash = crypto.createHash('md5').update(Object.keys(bundle.tree).toString()).digest('hex');
    var bundlePath = path.relative(zygo.baseURL, path.join(zygo.config.buildDir, bundleHash));
    var filePath = path.join(zygo.baseURL, bundlePath) + '.js';
    builder.buildTree(bundle.tree, filePath);
    bundlesJSON[bundlePath] = {
      routes: bundle.routes,
      modules: Object.keys(bundle.tree)
    };
  }));
  return new Promise((function(resolve, reject) {
    var bundlesPath = path.join(zygo.config.buildDir, 'bundles.json');
    fs.writeFile(bundlesPath, JSON.stringify(bundlesJSON), (function(error) {
      if (error)
        return reject(error);
      zygo.config.bundlesJSON = bundlesPath;
      return resolve(Config.save(zygo.config));
    }));
  }));
}
function getPageObjects(routes) {
  var pages = {};
  return traverse(routes, '', (function(path, route) {
    pages[path] = [];
    if (route.component)
      pages[path].push(route.component);
    if (route.clientHandler)
      pages[path].push(route.clientHandler);
    else if (route.handler)
      pages[path].push(route.handler);
    return Promise.all(pages[path].map((function(module) {
      return builder.trace(module);
    }))).then((function(tree) {
      return pages[path] = tree;
    }));
  })).then((function() {
    return pages;
  }));
}
function traverse(route, path, callback) {
  return callback(path, route).then((function() {
    return Promise.all(Object.keys(route).filter((function(key) {
      return key[0] === '/';
    })).map((function(key) {
      return traverse(route[key], path + key, callback);
    })));
  }));
}
//# sourceURL=build.js