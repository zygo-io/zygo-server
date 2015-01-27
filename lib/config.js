import path from 'path';
import fs from 'fs';

let defaultsDir = path.resolve(__dirname, '../defaults');
let zygoParseSpec = {
  buildDir: {type: 'path'}, //dir to build bundles into
  bundlesJSON: { type: 'json' }, //path to bundles config
  packageJSON: { type: 'path', default: 'package.json'}, //packageJSON path
  port: {default: 8080}, //server port
  anchors: {default: true}, //do we hook anchor <a> tags into route on the client?
  defaultOptimization: {default: 'tlo'}, //default bundle optimisation function - slo = single bundle, tlo = three layered
  env: {default: 'development'}, //environment: can be development or production

  template: { type: 'file', default: path.join(defaultsDir, 'template.hb') },
  routes: { type: 'json', default: path.join(defaultsDir, 'routes.json') },
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
    .then((json) =>
      Promise.all(
        Object.keys(spec)
          .map((key) => parseConfigObject(key, spec[key], json, result, baseDir))
      )
    )
    .then(() => result);
}

//Parses the given config object with name, given the json
// being parsed and a place to put the results. Throws an error
// if there is an issue.
function parseConfigObject(name, config, json, result, baseDir) {
  let value = json[name] || config.default;

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
        if (spec[key].type && spec[key].type === 'json') return;
        if (spec[key].type && spec[key].type === 'file') return;

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
    });
}

//Creates a function that shouts the reason for failure in
// config parsing ^_^.
function error(name, msg) {
  return () => {
    throw new Error("Error loading " + name + " in config - " + msg);
  };
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
  });
}

//Promise wrapper around fs.readFile()
function getFile(file) {
  return new Promise((resolve, reject) => {
    fs.readFile(file, "utf-8", (error, data) => {
      if (error) return reject(error);
      else return resolve(data);
    });
  });
}
