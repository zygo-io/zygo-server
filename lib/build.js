import builder from 'systemjs-builder';
import jspm from 'jspm';
import path from 'path';
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
export function build(zygo) {
  return config.load()
    .then(() => getRouteTrees(zygo.routes))
    .then(extractCommonTree)
    .then(runOptimization)
    .then((trees) => bundleTrees(trees, zygo))
    .then(() => console.log("Bundling finished, injected bundle info into config.js."));
}

//runs the optimisation function, subtracts the optimised trees from the route
// trees and runs the guarantee that module groups are disjoint.
function runOptimization(routeTrees) {
  var optimizedTrees = optimize(routeTrees);

  //Remove the optimized modules from the routeTrees.
  Object.keys(optimizedTrees).map((key) => {
    optimizedTrees[key].map((module) => {
      Object.keys(routeTrees).map((routeKey) => {
        delete routeTrees[routeKey][module];
      });
    });
  });

  //Add the optimized modules in as their own trees
  Object.keys(optimizedTrees).map((key) => {
    var routeKey = "_optimized_" + key;
    routeTrees[routeKey] = {};

    optimizedTrees[key].map((module) => {
      routeTrees[routeKey][module] = builder.loader.loads[module];
    });
  });

  //Assert that there are no shared dependencies
  let moduleCounts = getModuleCounts(routeTrees);
  Object.keys(moduleCounts).map((key) => {
    if (moduleCounts[key] > 1) throw new Error("Optimization does not return disjoint trace trees.");
  });

  return routeTrees;
}

//optimisation function - given the current list of traces keyed by route, as well
// as the common trace, output a list of module groups to be bundled separately
// as optimisation bundles. These are subtracted from the traces and those become
// the top layer route bundles.
function optimize(routeTrees) {
  //TODO: better optimization characterisation
  //God the american spelling of optimisation looks bad to my eyes.
  //For the moment, we just take out -anything- that is shared between -anyone-.
  //A proper optimization function will have to be written at some point ^_^.
  let moduleCounts = getModuleCounts(routeTrees);
  let sharedModules = [];
  Object.keys(moduleCounts).map((key) => {
    if (moduleCounts[key] > 1)
      sharedModules.push(key);
  });

  return {
    shared: sharedModules
  };
}

//Given traces keyed by route, return an object containing:
// {moduleName: number of times it occurs in the traces }
function getModuleCounts(routeTrees) {
  let modules = {};
  Object.keys(routeTrees).map((key) => {
    Object.keys(routeTrees[key]).map((module) => {
      if (!modules[module]) modules[module] = 0;
      modules[module]++;
    });
  });

  return modules;
}

function bundleTrees(routeTrees, zygo) {
  if (!zygo.config.buildDir) throw new Error("buildDir has not been set in config zygo.json.");

  //First we clear out existing bundle config.
  //TODO: we need to maybe be smarter about this. A simple map lookup would suffice.
  config.loader.bundles = {};

  Object.keys(routeTrees).map((key) => {
    //TODO add hashes on contents to bundles
    //TODO: nicer file sanitization, get rid of the dependency
    let modulePath = path.join(zygo.config.buildDir, sanitize(key, {replacement: '_'})) + "#HASH";
    let filePath = path.join(zygo.baseURL, modulePath) + '.js';

    //Build the bundle!
    builder.buildTree(routeTrees[key], filePath);

    //Save bundle data into config.js.
    config.loader.bundles[modulePath] =
      Object.keys(routeTrees[key])
        .filter((moduleName) => routeTrees[key][moduleName].metadata.build !== false);
  });

  return config.save();
}

function extractCommonTree(routeTrees) {
  let common;
  Object.keys(routeTrees).map((key) => {
    if (common) common = builder.intersectTrees(common, routeTrees[key]);
    else common = routeTrees[key];
  });

  //remove common from the other trees
  Object.keys(routeTrees).map((key) => {
    routeTrees[key] = builder.subtractTrees(routeTrees[key], common);
  });

  routeTrees.common = common;
  return routeTrees;
}

function getRouteTrees(routes) {
  let routeTrees = {};

  return Object.keys(routes).reduce((chain, next) => {
    return chain
      .then(() => getRouteTree(routes[next]))
      .then((tree) => routeTrees[next] = tree);

  }, Promise.resolve())
    .then(() => routeTrees);
}

function getRouteTree(route) {
  //The dependencies are the route's handler and component.
  let deps = [route];

  return jspm.import(route)
    .then((handler) => deps.push(handler.component))

    //Merge the dependency traces.
    .then(() => Promise.all(deps.map((dep) => builder.trace(dep))))
    .then((trees) => trees.reduce((result, next) => builder.addTrees(result, next.tree), {}));
}
