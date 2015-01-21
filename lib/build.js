import builder from 'systemjs-builder';
import jspm from 'jspm';
import path from 'path';
import crypto from 'crypto';
import sanitize from 'sanitize-filename';

//Private jspm - config modifying api is not yet exposed by jspm,
// so until then we have to hack a little.
import config from 'jspm/lib/config';

//We bundle per-route - the common imports and extracted into a core
// bundle which is loaded with the css in the zygo footer before render.
//Optimisations should be specified somehow - essentially, we don't want
// to duplicate dependencies in any of the packages. This is for efficiency,
// obviously, but there is currently a bug(?) in systemJS that breaks if you
// do this regardless.
//The resulting bundles are then injected into the config.js so the client
// knows how to find them.
//So excite \(^-^)/. Such wow.
export function build(zygo, optimization=defaultOptimization) {
  return config.load()
    .then(() => getRouteBundles(zygo.routes))
    .then(optimization)
    .then((bundles) => _build(bundles, zygo));
}

function _build(bundles, zygo) {
  if (!zygo.config.buildDir) throw new Error("buildDir has not been set in config zygo.json.");

  //First we clear out existing bundle config.
  //TODO: we need to maybe be smarter about this. A simple map lookup would suffice.
  config.loader.bundles = {};

  bundles.map((bundle) => {
    let bundleHash = crypto.createHash('md5')
    .update(Object.keys(bundle.modules).toString())
    .digest('hex');

    let route = bundle.route ? bundle.route : '';

    let bundlePath = path.join(zygo.config.buildDir, sanitize(route, {replacement: '0'}), bundleHash);
    let filePath = path.join(zygo.baseURL, bundlePath) + '.js';

    //Build the bundle!
    builder.buildTree(bundle.modules, filePath);

    //Save bundle data into config.js.
    config.loader.bundles[bundlePath] =
    Object.keys(bundle.modules)
    .filter((module) => bundle.modules[module].metadata.build !== false);
  });

  return config.save();
}

function defaultOptimization(bundles) {
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
    modules: {}
  };

  //run through bundles - if a bundle is shared by another, cut it into moduleCounts
  let moduleCounts = getModuleCounts(bundles);
  bundles.map((bundle) => {
    Object.keys(bundle.modules).map((module) => {
      if (moduleCounts[module] > 1) {
        sharedDepBundle.modules[module] = bundle.modules[module];
        delete bundle.modules[module];
      }
    });
  });

  bundles.push(sharedDepBundle);
  return bundles;
}

//Extract a bundle of modules common to each of the current bundles
function extractCommon(bundles) {
  let commonBundle = {};

  bundles.map((bundle) => {
    if (!commonBundle.modules)
      commonBundle.modules = bundle.modules;

    commonBundle.modules =
      builder.intersectTrees(commonBundle.modules, bundle.modules);
  });

  bundles.map((bundle) => {
    bundle.modules = builder.subtractTrees(bundle.modules, commonBundle.modules);
  });

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

function getRouteBundles(routes) {
  let routeModules = [];

  return Object.keys(routes).reduce((chain, next) => {
    return chain
      .then(() => getRouteTrace(routes[next]))
      .then((tree) =>
        routeModules.push({
          route: next,
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
