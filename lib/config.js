import path from 'path';
import fs from 'fs';
import jspm from 'jspm';
import * as Debug from './debug';

let defaultsDir = path.resolve(__dirname, '../defaults');
let zygoParseSpec = {
  buildDir: {type: 'dir'}, //dir to build bundles into
  bundlesJSON: { type: 'json' }, //path to bundles config
  packageJSON: { type: 'path', default: 'package.json'}, //packageJSON path
  defaultContext: { default: {} }, //Default context object to clone on each request.
  port: {default: 8080}, //server port
  anchors: {default: true}, //do we hook anchor <a> tags into route on the client?
  defaultOptimization: {default: 'tlo'}, //default bundle optimisation function - slo = single bundle, tlo = three layered
  env: {default: 'development'}, //environment: can be development or production
  middleware: { default: [] }, //middleware for server. specified as node or jspm modules

  template: { type: 'file', default: path.join(defaultsDir, 'template.hb') },
  routes: { required: true, type: 'json', default: './routes.json' },
};

let zygoSaveSpec = {
  //By default, we just want to save what already exists with no changes.
};

//Parses the JSON buffer according to the spec passed in. The spec
// is an object containing config objects in the following format:
// { routesJSON : {[type: 'json'], [required: true]} }
//An error is thrown if the buffer does not conform to the spec,
// otherwise a parsed object is returned in the following format:
// {name: value, etc...}
//Asynchronous! configPath is read relative to process pwd if not absolute.
export function parse(configPath, spec=zygoParseSpec) {
  let result = {};
  let baseDir;

  return resolvePath(configPath, process.cwd())
    .then((resolvedPath) => {
      baseDir = path.dirname(resolvedPath);
      result.path = resolvedPath;

      return getFile(resolvedPath);
    })
    .then(JSON.parse)
    .then((json) => {
      //Parse the spec
      return Promise.all(
        Object.keys(spec)
          .map((key) => parseConfigObject(key, spec[key], json, result, baseDir))
      )
        .then(() => {
          //Anything not parsed in the json and not present in the config already we add.
          //This allows users to specify custom config options to be passed into the middleware.
          Object.keys(json).map((key) => {
            if (!result[key]) result[key] = json[key];
          });
        });
    })
    .then(() => result)
    .catch(Debug.propagate("Error parsing zygo.json: "));
}

//Parses the given config object with name, given the json
// being parsed and a place to put the results. Throws an error
// if there is an issue.
function parseConfigObject(name, config, json, result, baseDir) {
  let value = json[name];
  if (!value && config.default) {
    if (Debug.mode.debugMode)
      console.log("No config for " + name + ", reverting to default: " + config.default);

    value = config.default;
  }

  if (!value) {
    if (config.required)
      throw new Error("Error: config does not contain a value for " + name);
    return;
  }

  //No type specified, just copy value straight.
  if (!config.type)
    return Promise.resolve()
      .then(() => result[name] = value);

  //File path
  if (config.type === 'path')
    return resolvePath(value, baseDir)
      .then((path) => result[name] = path)
      .catch(error(name, "problem resolving path: " + value));

  //Dir path
  if (config.type === 'dir')
    return resolveDir(value, baseDir)
      .then((path) => result[name] = path)
      .catch(error(name, "couldn't stat or create directory: " + value));

  //Loading a text file
  if (config.type === 'file')
    return resolvePath(value, baseDir)
      .then(getFile)
      .then((data) => result[name] = data)
      .catch(error(name, "problem loading file: " + value));

  //Loading a json file
  if (config.type === 'json')
    return resolvePath(value, baseDir)
      .then(getFile)
      .then(JSON.parse)
      .then((data) => result[name] = data)
      .catch(error(name, "problem loading json: " + value));
}

//Given an object returned by a previous parse(), and
// the spec to save to, we run through all non-file/json
// config objects and update them in the config if needed.
//This is non-destructive - if there are other things in the config
// file we are saving to, they are preserved.
export function save(config, spec=zygoSaveSpec) {
  return getFile(config.path)
    .then(JSON.parse)
    .then((json) => {
      Object.keys(spec).map((key) => {
        //We don't support saving files.
        if (spec[key].type && spec[key].type === 'json') return;
        if (spec[key].type && spec[key].type === 'file') return;

        //Delete the given record
        if (spec[key].type && spec[key].type === 'delete')
          return delete json[key];

        //No matches, get value and save it.
        let value = config[key];
        if (value) {
          //If the value is a path, we de-normalise it relative to config.
          if (spec[key].type && spec[key].type === 'path')
            value = path.relative(path.dirname(config.path), value);

          json[key] = value;
        }
      });

      return json;
    })
    .then((json) => {
      return new Promise((resolve, reject) => {
        fs.writeFile(config.path, JSON.stringify(json, null, 2), function(error) {
          if (error) return reject(error);
          return resolve();
        });
      });
    })
    .catch(Debug.propagate("Error saving config: "));
}

//Creates a function that shouts the reason for failure in
// config parsing ^_^.
function error(name, msg) {
  return () => {
    throw new Error("Error loading " + name + " in config - " + msg);
  };
}

//Resolve to an absolute dir path. If it doesn't exist, we create it.
function resolveDir(url, relativeTo) {
  return new Promise((resolve, reject) => {
    resolvePath(url, relativeTo)
      .then((path) => resolve(path))
      .catch((error) => {
        console.log("Can't stat dir " + url + ", creating it.");

        var dirs = url.split(path.sep);
        dirs.reduce((chain, dir, i) => {
          return chain.then(() => {
            return new Promise((resolve, reject) => {
              //We create dirs in cascading segments, a, a/b, a/b/c etc.
              fs.mkdir(path.resolve(relativeTo, dirs.slice(0, i+1).join(path.sep)), resolve);
            });
          });
        }, Promise.resolve())
          .then(() => resolve( resolvePath(url, relativeTo) ))
          .catch(reject);
      });
  })
    .catch(Debug.propagate("Error resolving dir in config: "));
}

//Resolve a file/dir to a path - checks relative first,
// if that fails we check absolute. Else throw an error.
function resolvePath(url, relativeTo) {
  let attempt = path.resolve(relativeTo, url);

  return new Promise((resolve, reject) => {
    fs.stat(attempt, (error) => {
      if (!error) return resolve(attempt);

      attempt = path.resolve(url);
      fs.stat(attempt, (error) => {
        if (error) return reject(error);
        return resolve(attempt);
      });
    });
  })
    .catch(Debug.propagate("Error resolving path in config: "));
}

//Promise wrapper around fs.readFile()
function getFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf-8", (error, data) => {
      if (error) return reject(error);
      else return resolve(data);
    });
  })
    .catch(Debug.propagate("Error getting file in config: "));
}

//Desugar routes.js. Syntactic convenience, doesn't belong in actual code.
//We allow specifying subroutes as components directly for convenience.
export function desugarRoutes(route, parent=null) {
  let result = {};

  return Promise.all(
    Object.keys(route).map((key) => {
      if (typeof route[key] === "string") {
        if (key[0] === '/') {
          // this is a route module path, locate and import it in
          return jspm.normalize(route[key], parent)
            .then((jspmPath) => {
              return jspm.locate(route[key], parent)
                .then((nodePath) => {
                  if (nodePath.match(/\.json\.js$/)) {
                    //json blob to import
                    nodePath = nodePath.replace(".json.js", ".json");
                    route[key] = require(nodePath);
                    return desugarRoutes(route[key], jspmPath)
                  } else {
                    //component path
                    route[key] = {
                      component: jspmPath
                    };
                  }
                });
            });
        } else  {
          // this is a component path, normalize it
          return jspm.normalize(route[key], parent)
            .then((routePath) => route[key] = routePath);
        }
      } else {
        return desugarRoutes(route[key], parent);
      }
    })
  )
    .then(() => flatten(route));
}

//Flattens given route - if there is a '/' or '' subroute, it gets flattened onto parent
function flatten(route) {
  Object.keys(route).map((key) => {
    if (key === '/' || key === '') {
      Object.keys(route[key]).map((innerKey) => {
        route[innerKey] = route[key][innerKey];
      });
      route[key] = undefined;
    }
  });

  return route;
}
