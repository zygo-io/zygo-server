"use strict";
Object.defineProperties(exports, {
  build: {get: function() {
      return build;
    }},
  __esModule: {value: true}
});
var $__systemjs_45_builder__,
    $__jspm__,
    $__path__,
    $__sanitize_45_filename__;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var sanitize = ($__sanitize_45_filename__ = require("sanitize-filename"), $__sanitize_45_filename__ && $__sanitize_45_filename__.__esModule && $__sanitize_45_filename__ || {default: $__sanitize_45_filename__}).default;
function build(zygo) {
  return getRouteTrees(zygo.routes).then(extractCommonTree).then((function(trees) {
    return bundleTrees(trees, zygo);
  })).then((function() {
    return console.log("Finished build.");
  }));
}
function bundleTrees(routeTrees, zygo) {
  if (!zygo.config.buildDir)
    throw new Error("buildDir has not been set in config zygo.json.");
  Object.keys(routeTrees).map((function(key) {
    builder.buildTree(routeTrees[key], path.resolve(zygo.config.buildDir, sanitize(key, {replacement: '_'})) + '.js');
  }));
}
function extractCommonTree(routeTrees) {
  var common;
  Object.keys(routeTrees).map((function(key) {
    if (common)
      common = builder.intersectTrees(common, routeTrees[key]);
    else
      common = routeTrees[key];
  }));
  Object.keys(routeTrees).map((function(key) {
    routeTrees[key] = builder.subtractTrees(routeTrees[key], common);
  }));
  routeTrees.common = common;
  return routeTrees;
}
function getRouteTrees(routes) {
  var routeTrees = {};
  return Object.keys(routes).reduce((function(chain, next) {
    return chain.then((function() {
      return getRouteTree(routes[next]);
    })).then((function(tree) {
      return routeTrees[next] = tree;
    }));
  }), Promise.resolve()).then((function() {
    return routeTrees;
  }));
}
function getRouteTree(route) {
  if (!(route instanceof Array))
    route = [route];
  var deps = route;
  return Promise.all(route.map((function(handler) {
    return jspm.import(handler);
  }))).then((function(handlers) {
    return handlers.map((function(handler) {
      return deps.push(handler.component);
    }));
  })).then((function() {
    return Promise.all(deps.map((function(dep) {
      return builder.trace(dep);
    })));
  })).then((function(trees) {
    return trees.reduce((function(result, next) {
      return builder.addTrees(result, next.tree);
    }), {});
  }));
}
//# sourceURL=build.js