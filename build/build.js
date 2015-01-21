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
    $__sanitize_45_filename__,
    $__jspm_47_lib_47_config__;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var sanitize = ($__sanitize_45_filename__ = require("sanitize-filename"), $__sanitize_45_filename__ && $__sanitize_45_filename__.__esModule && $__sanitize_45_filename__ || {default: $__sanitize_45_filename__}).default;
var config = ($__jspm_47_lib_47_config__ = require("jspm/lib/config"), $__jspm_47_lib_47_config__ && $__jspm_47_lib_47_config__.__esModule && $__jspm_47_lib_47_config__ || {default: $__jspm_47_lib_47_config__}).default;
function build(zygo) {
  return config.load().then((function() {
    return getRouteTrees(zygo.routes);
  })).then(extractCommonTree).then(runOptimization).then((function(trees) {
    return bundleTrees(trees, zygo);
  })).then((function() {
    return console.log("Bundling finished, injected bundle info into config.js.");
  }));
}
function runOptimization(routeTrees) {
  var optimizedTrees = optimize(routeTrees);
  Object.keys(optimizedTrees).map((function(key) {
    optimizedTrees[key].map((function(module) {
      Object.keys(routeTrees).map((function(routeKey) {
        delete routeTrees[routeKey][module];
      }));
    }));
  }));
  Object.keys(optimizedTrees).map((function(key) {
    var routeKey = "_optimized_" + key;
    routeTrees[routeKey] = {};
    optimizedTrees[key].map((function(module) {
      routeTrees[routeKey][module] = builder.loader.loads[module];
    }));
  }));
  var moduleCounts = getModuleCounts(routeTrees);
  Object.keys(moduleCounts).map((function(key) {
    if (moduleCounts[key] > 1)
      throw new Error("Optimization does not return disjoint trace trees.");
  }));
  return routeTrees;
}
function optimize(routeTrees) {
  var moduleCounts = getModuleCounts(routeTrees);
  var sharedModules = [];
  Object.keys(moduleCounts).map((function(key) {
    if (moduleCounts[key] > 1)
      sharedModules.push(key);
  }));
  return {shared: sharedModules};
}
function getModuleCounts(routeTrees) {
  var modules = {};
  Object.keys(routeTrees).map((function(key) {
    Object.keys(routeTrees[key]).map((function(module) {
      if (!modules[module])
        modules[module] = 0;
      modules[module]++;
    }));
  }));
  return modules;
}
function bundleTrees(routeTrees, zygo) {
  if (!zygo.config.buildDir)
    throw new Error("buildDir has not been set in config zygo.json.");
  config.loader.bundles = {};
  Object.keys(routeTrees).map((function(key) {
    var modulePath = path.join(zygo.config.buildDir, sanitize(key, {replacement: '_'})) + "#HASH";
    var filePath = path.join(zygo.baseURL, modulePath) + '.js';
    builder.buildTree(routeTrees[key], filePath);
    config.loader.bundles[modulePath] = Object.keys(routeTrees[key]).filter((function(moduleName) {
      return routeTrees[key][moduleName].metadata.build !== false;
    }));
  }));
  return config.save();
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
  var deps = [route];
  return jspm.import(route).then((function(handler) {
    return deps.push(handler.component);
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