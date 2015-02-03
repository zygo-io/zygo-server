import optimize from 'systemjs-basic-optimize';
import builder from 'systemjs-builder';
import jspm from 'jspm';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as Config from './config';

//We bundle per-route using a systemjs optimization - these are being
// discussed currently in the systemjs builder issue51.
//The resulting bundles are then injected into the config.js so the client
// knows how to find them.
//So excite \(^-^)/. Such wow.
export function build(zygo) {
  return getPageObjects(zygo.config.routes)
    .then(optimize)
    .then((bundles) => _build(bundles, zygo));
}

function _build(bundles, zygo) {
  if (!zygo.config.buildDir) throw new Error("buildDir has not been set in zygo.json.");

  //Object to be save to bundles.json in build directory.
  let bundlesJSON = {};

  bundles.map((bundle) => {
    let bundleHash = crypto.createHash('md5');
    Object.keys(bundle.tree).map((key) => bundleHash.update(bundle.tree[key].source));
    bundleHash = bundleHash.digest('hex');

    //Bundle path is normalised to zygo.baseURL for JSPM visibility.
    let bundlePath = path.relative(zygo.baseURL, path.join(zygo.config.buildDir, bundleHash));
    let filePath = path.join(zygo.baseURL, bundlePath) + '.js';

    //Build the bundle!
    builder.buildTree(bundle.tree, filePath);

    //Save bundle data into bundles.json in the build directory.
    //We key the bundle by bundlePath, and store the route/modules.
    //We don't want the other metadata associated with modules, so
    // we store just the keys (module names) themselves.
    bundlesJSON[bundlePath] = {
      routes: bundle.routes,
      modules: Object.keys(bundle.tree)
    };
  });

  return new Promise((resolve, reject) => {
    let bundlesPath = path.join(zygo.config.buildDir, 'bundles.json');
    fs.writeFile(bundlesPath, JSON.stringify(bundlesJSON), (error) => {
      if (error) return reject(error);

      //Save bundles json path into zygo config
      zygo.config.bundlesJSON = bundlesPath;
      return resolve(
        Config.save(zygo.config, {
          bundlesJSON: { type: 'path' }
        })
      );
    });
  });
}

//We extract each route into a separate 'page'
function getPageObjects(routes) {
  let pages = {};

  return traverse(routes, '', (path, route) => {
    return Promise.resolve()
      .then(() => route.component ? jspm.import(route.component) : null)
      .then((module) => {
        pages[path] = [];
        if (route.component) pages[path].push(route.component);
        if (module && module.default.clientHandler) pages[path].push(module.default.clientHandler);
        else if (module && module.default.handler) pages[path].push(module.default.handler);

        //We trace dependencies, and filter out css (as systemJS doesn't support bundling this atm)
        return Promise.all(
          pages[path].map((modulePath) =>
            builder.trace(modulePath)
              .then((trace) => {
                var result = {
                  moduleName: trace.moduleName,
                  tree: []
                };

                Object.keys(trace.tree)
                  .filter((key) => !key.match(/\.css!/))
                  .map((key) => result.tree[key] = trace.tree[key]);

                return result;
              })
          )
        )
          .then((tree) => pages[path] = tree);
      });
  })
    .then(() => pages);
}

//Traverse routes tree, running callback at each node.
//Callback takes args: cb(path, route)
function traverse(route, path, callback) {
  return callback(path, route)
    .then(() =>
      Promise.all(
        Object.keys(route)
          .filter((key) => key[0] === '/')
          .map((key) => traverse(route[key], path+key, callback))
      )
    );
}
