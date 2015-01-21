import builder from 'systemjs-builder';
import jspm from 'jspm';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import sanitize from 'sanitize-filename';
import * as Config from './config';

//We bundle per-route - the common imports and extracted into a core
// bundle which is loaded with the css in the zygo footer before render.
//Optimisations should be specified somehow - essentially, we don't want
// to duplicate dependencies in any of the packages. This is for efficiency,
// obviously, but there is currently a bug(?) in systemJS that breaks if you
// do this regardless.
//The resulting bundles are then injected into the config.js so the client
// knows how to find them.
//So excite \(^-^)/. Such wow.
export function build(zygo, optimization) {
  if (!optimization) {
    if (zygo.config.defaultOptimization === 'slo')
      optimization = defaultSingleLayerOptimization;

    if (zygo.config.defaultOptimization === 'tlo')
      optimization = defaultThreeLayerOptimization;

    if (!optimization)
      throw new Error("Specify a default optimization function (slo or tlo) in zygo.json.");
  }

  return getRouteBundles(zygo.routes)
    .then(optimization)
    .then((bundles) => _build(bundles, zygo));
}

function _build(bundles, zygo) {
  if (!zygo.config.buildDir) throw new Error("buildDir has not been set in zygo.json.");

  //Object to be save to bundles.json in build directory.
  let bundlesJSON = {};

  bundles.map((bundle) => {
    let bundleHash = crypto.createHash('md5')
    .update(Object.keys(bundle.modules).toString())
    .digest('hex');

    //Bundle path is normalised to zygo.baseURL for JSPM visibility.
    let bundlePath = path.relative(zygo.baseURL, path.join(zygo.config.buildDir, bundleHash));
    let filePath = path.join(zygo.baseURL, bundlePath) + '.js';

    //Build the bundle!
    builder.buildTree(bundle.modules, filePath);

    //Save bundle data into bundles.json in the build directory.
    //We key the bundle by bundlePath, and store the route/modules.
    //We don't want the other metadata associated with modules, so
    // we store just the keys (module names) themselves.
    bundlesJSON[bundlePath] = {
      routes: bundle.routes,
      modules: Object.keys(bundle.modules)
    };
  });

  return new Promise((resolve, reject) => {
    let bundlesPath = path.join(zygo.config.buildDir, 'bundles.json');
    fs.writeFile(bundlesPath, JSON.stringify(bundlesJSON), (error) => {
      if (error) return reject(error);

      zygo.config.bundlesJSON = bundlesPath;
      return resolve(Config.save(zygo.config));
    });
  });
}

//Bundles everything into a single bundle.
function defaultSingleLayerOptimization(bundles) {
  var combined = {
    routes: [],
    modules: {}
  };

  bundles.map((bundle) => {
    combined.routes = combined.routes.concat(bundle.routes);

    Object.keys(bundle.modules).map((module) =>
      combined.modules[key] = bundle.modules[key]
    );
  });

  return [combined];
}

//Creates three layers of bundles:
// A common bundle - modules present in every bundle
// A shared bundle - modules present in some bundles, but not all
// Individual route bundles - things that are left unique to each route
//Guarantees no module duplication.
function defaultThreeLayerOptimization(bundles) {
  //Extract a common bundle.
  extractCommon(bundles);

  //Extract a shared dependency bundle.
  //Differs from common in that a shared dependency between two
  // bundles might not be shared by a third, so it doesn't get put into
  // a common bundle, for instance.
  extractSharedDep(bundles);

  return bundles;
}

//Extract a bundle of modules that are shared by some of the current bundles.
//Those shared by all are caught by extractCommon.
function extractSharedDep(bundles) {
  let sharedDepBundle = {
    routes: [],
    modules: {}
  };

  //run through bundles - if a bundle is shared by another, cut it into moduleCounts
  let moduleCounts = getModuleCounts(bundles);
  bundles.map((bundle) => {
    sharedDepBundle.routes = sharedDepBundle.routes.concat(bundle.routes);

    Object.keys(bundle.modules).map((module) => {
      if (moduleCounts[module] > 1) {
        sharedDepBundle.modules[module] = bundle.modules[module];
        delete bundle.modules[module];
      }
    });
  });

  sharedDepBundles.routes = removeDuplicates(sharedDepBundle.routes);
  bundles.push(sharedDepBundle);
  return bundles;
}

//Extract a bundle of modules common to each of the current bundles
function extractCommon(bundles) {
  let commonBundle = {
    routes: [],
    modules: {}
  };

  bundles.map((bundle) => {
    commonBundle.routes = commonBundle.routes.concat(bundle.routes);

    if (Object.keys(commonBundle.modules).length === 0)
      commonBundle.modules = bundle.modules;

    commonBundle.modules =
      builder.intersectTrees(commonBundle.modules, bundle.modules);
  });

  bundles.map((bundle) => {
    bundle.modules = builder.subtractTrees(bundle.modules, commonBundle.modules);
  });

  commonBundle.routes = removeDuplicates(commonBundle.routes);
  bundles.push(commonBundle);
  return bundles;
}

//Counts the number of times each module occurs in the group of bundles.
function getModuleCounts(bundles) {
  let moduleCounts = {};
  bundles.map((bundle) => {
    Object.keys(bundle.modules).map((module) => {
      if (!moduleCounts[module]) moduleCounts[module] = 0;
      moduleCounts[module]++;
    });
  });

  return moduleCounts;
}

//Remove duplicates in an array
function removeDuplicates(array) {
  return array.filter((x, i) => array.indexOf(x) === i);
}

function getRouteBundles(routes) {
  let routeModules = [];

  return Object.keys(routes).reduce((chain, next) => {
    return chain
      .then(() => getRouteTrace(routes[next]))
      .then((tree) =>
        routeModules.push({
          routes: [next],
          modules: tree
        })
      );

  }, Promise.resolve())
    .then(() => routeModules);
}

function getRouteTrace(route) {
  //The dependencies are the route's handler and component.
  let deps = [route];

  return jspm.import(route)
    .then((handler) => deps.push(handler.component))

    //Merge the dependency traces.
    .then(() => Promise.all(deps.map((dep) => builder.trace(dep))))
    .then((trees) => trees.reduce((result, next) => builder.addTrees(result, next.tree), {}));
}
