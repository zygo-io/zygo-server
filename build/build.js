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
    $__fs__,
    $__crypto__,
    $__sanitize_45_filename__,
    $__config__;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var crypto = ($__crypto__ = require("crypto"), $__crypto__ && $__crypto__.__esModule && $__crypto__ || {default: $__crypto__}).default;
var sanitize = ($__sanitize_45_filename__ = require("sanitize-filename"), $__sanitize_45_filename__ && $__sanitize_45_filename__.__esModule && $__sanitize_45_filename__ || {default: $__sanitize_45_filename__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__});
function build(zygo, optimization) {
  if (!optimization) {
    if (zygo.config.defaultOptimization === 'slo')
      optimization = defaultSingleLayerOptimization;
    if (zygo.config.defaultOptimization === 'tlo')
      optimization = defaultThreeLayerOptimization;
    if (!optimization)
      throw new Error("Specify a default optimization function (slo or tlo) in zygo.json.");
  }
  return getRouteBundles(zygo.routes).then(optimization).then((function(bundles) {
    return _build(bundles, zygo);
  }));
}
function _build(bundles, zygo) {
  if (!zygo.config.buildDir)
    throw new Error("buildDir has not been set in zygo.json.");
  var bundlesJSON = {};
  bundles.map((function(bundle) {
    var bundleHash = crypto.createHash('md5').update(Object.keys(bundle.modules).toString()).digest('hex');
    var bundlePath = path.relative(zygo.baseURL, path.join(zygo.config.buildDir, bundleHash));
    var filePath = path.join(zygo.baseURL, bundlePath) + '.js';
    builder.buildTree(bundle.modules, filePath);
    bundlesJSON[bundlePath] = {
      routes: bundle.routes,
      modules: Object.keys(bundle.modules)
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
function defaultSingleLayerOptimization(bundles) {
  var combined = {
    routes: [],
    modules: {}
  };
  bundles.map((function(bundle) {
    combined.routes = combined.routes.concat(bundle.routes);
    Object.keys(bundle.modules).map((function(module) {
      return combined.modules[key] = bundle.modules[key];
    }));
  }));
  return [combined];
}
function defaultThreeLayerOptimization(bundles) {
  extractCommon(bundles);
  extractSharedDep(bundles);
  return bundles;
}
function extractSharedDep(bundles) {
  var sharedDepBundle = {
    routes: [],
    modules: {}
  };
  var moduleCounts = getModuleCounts(bundles);
  bundles.map((function(bundle) {
    sharedDepBundle.routes = sharedDepBundle.routes.concat(bundle.routes);
    Object.keys(bundle.modules).map((function(module) {
      if (moduleCounts[module] > 1) {
        sharedDepBundle.modules[module] = bundle.modules[module];
        delete bundle.modules[module];
      }
    }));
  }));
  sharedDepBundle.routes = removeDuplicates(sharedDepBundle.routes);
  bundles.push(sharedDepBundle);
  return bundles;
}
function extractCommon(bundles) {
  var commonBundle = {
    routes: [],
    modules: {}
  };
  bundles.map((function(bundle) {
    commonBundle.routes = commonBundle.routes.concat(bundle.routes);
    if (Object.keys(commonBundle.modules).length === 0)
      commonBundle.modules = bundle.modules;
    commonBundle.modules = builder.intersectTrees(commonBundle.modules, bundle.modules);
  }));
  bundles.map((function(bundle) {
    bundle.modules = builder.subtractTrees(bundle.modules, commonBundle.modules);
  }));
  commonBundle.routes = removeDuplicates(commonBundle.routes);
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
function removeDuplicates(array) {
  return array.filter((function(x, i) {
    return array.indexOf(x) === i;
  }));
}
function getRouteBundles(routes) {
  var routeModules = [];
  return Object.keys(routes).reduce((function(chain, next) {
    return chain.then((function() {
      return getRouteTrace(routes[next]);
    })).then((function(tree) {
      return routeModules.push({
        routes: [next],
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