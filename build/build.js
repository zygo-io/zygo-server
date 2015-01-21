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
    $__crypto__,
    $__sanitize_45_filename__,
    $__config__;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var crypto = ($__crypto__ = require("crypto"), $__crypto__ && $__crypto__.__esModule && $__crypto__ || {default: $__crypto__}).default;
var sanitize = ($__sanitize_45_filename__ = require("sanitize-filename"), $__sanitize_45_filename__ && $__sanitize_45_filename__.__esModule && $__sanitize_45_filename__ || {default: $__sanitize_45_filename__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__});
function build(zygo) {
  var optimization = arguments[1] !== (void 0) ? arguments[1] : defaultOptimization;
  return getRouteBundles(zygo.routes).then(optimization).then((function(bundles) {
    return _build(bundles, zygo);
  }));
}
function _build(bundles, zygo) {
  if (!zygo.config.buildDir)
    throw new Error("buildDir has not been set in zygo.json.");
  zygo.config.bundles = {};
  bundles.map((function(bundle) {
    var bundleHash = crypto.createHash('md5').update(Object.keys(bundle.modules).toString()).digest('hex');
    var route = bundle.route ? bundle.route : '';
    var bundlePath = path.join(zygo.config.buildDir, sanitize(route, {replacement: '0'}), bundleHash);
    var filePath = path.join(zygo.baseURL, bundlePath) + '.js';
    builder.buildTree(bundle.modules, filePath);
    zygo.config.bundles[bundlePath] = {
      route: bundle.route,
      modules: Object.keys(bundle.modules)
    };
  }));
  return Config.save(zygo.config);
}
function defaultOptimization(bundles) {
  extractCommon(bundles);
  extractSharedDep(bundles);
  return bundles;
}
function extractSharedDep(bundles) {
  var sharedDepBundle = {modules: {}};
  var moduleCounts = getModuleCounts(bundles);
  bundles.map((function(bundle) {
    Object.keys(bundle.modules).map((function(module) {
      if (moduleCounts[module] > 1) {
        sharedDepBundle.modules[module] = bundle.modules[module];
        delete bundle.modules[module];
      }
    }));
  }));
  bundles.push(sharedDepBundle);
  return bundles;
}
function extractCommon(bundles) {
  var commonBundle = {};
  bundles.map((function(bundle) {
    if (!commonBundle.modules)
      commonBundle.modules = bundle.modules;
    commonBundle.modules = builder.intersectTrees(commonBundle.modules, bundle.modules);
  }));
  bundles.map((function(bundle) {
    bundle.modules = builder.subtractTrees(bundle.modules, commonBundle.modules);
  }));
  bundles.push(commonBundle);
  return bundles;
}
function getModuleCounts(bundles) {
  var moduleCounts = {};
  bundles.map((function(bundle) {
    Object.keys(bundle.modules).map((function(module) {
      if (!moduleCounts[module])
        moduleCounts[module] = 0;
      moduleCounts[module]++;
    }));
  }));
  return moduleCounts;
}
function getRouteBundles(routes) {
  var routeModules = [];
  return Object.keys(routes).reduce((function(chain, next) {
    return chain.then((function() {
      return getRouteTrace(routes[next]);
    })).then((function(tree) {
      return routeModules.push({
        route: next,
        modules: tree
      });
    }));
  }), Promise.resolve()).then((function() {
    return routeModules;
  }));
}
function getRouteTrace(route) {
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