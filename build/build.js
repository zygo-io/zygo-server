"use strict";
Object.defineProperties(exports, {
  build: {get: function() {
      return build;
    }},
  __esModule: {value: true}
});
var $__systemjs_45_builder__,
    $__jspm__;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
function build(zygo) {
  return getRouteTrees(zygo.routes).then(extractCommonTree).then(console.log.bind(console)).catch(console.log.bind(console));
}
function extractCommonTree(routeTrees) {
  var common;
  Object.keys(routeTrees).map((function(key) {
    if (common)
      common = builder.intersectTrees(common, routeTrees[key]);
    else
      common = routeTrees[key];
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
      if (handler.deps)
        deps = deps.concat(handler.deps);
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