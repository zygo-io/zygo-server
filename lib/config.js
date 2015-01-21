import path from 'path';
import fs from 'fs';

let defaultsDir = path.resolve(__dirname, '../defaults');
let zygoSpec = {
  buildDir: {}, //dir to build bundles into
  packageJSON: {default: 'package.json'}, //packageJSON path
  port: {default: 8080}, //server port
  anchors: {default: true}, //do we hook anchor <a> tags into route on the client?

  template: { type: 'file', default: path.join(defaultsDir, 'template.hb') },
  routes: { type: 'json', default: path.join(defaultsDir, 'routes.json') },
  clientRoutes: { type: 'json', default: path.join(defaultsDir, 'routes.json') },
  serverRoutes: { type: 'json', default: path.join(defaultsDir, 'routes.json') }
};

//Parses the JSON buffer according to the spec passed in. The spec
// is an object containing config objects in the following format:
// { routesJSON : {[type: 'json'], [required: true]} }
//An error is thrown if the buffer does not conform to the spec,
// otherwise a parsed object is returned in the following format:
// {name: value, etc...}
//Asynchronous!
export function parse(configPath, spec=zygoSpec) {
  let baseDir = path.dirname(configPath);
  let result = {};

  return getFile(configPath)
    .then((data) => JSON.parse(data))
    .then((json) =>
      Promise.all(
        Object.keys(spec)
          .map((key) => parseConfigObject(key, spec[key], json))
      )
    )
    .then(() => result);

  function parseConfigObject(name, config, json) {
    let value = json[name] || config.default;

    if (!value) {
      if (config.required)
        throw new Error("Error: config does not contain a value for " + name);
    }

    //No type specified, just copy value straight.
    if (!config.type)
      return Promise.resolve()
        .then(() => result[name] = value);

    //Loading a text file
    if (config.type === 'file')
      return getFile(value, baseDir)
        .then((data) => result[name] = data);

    //Loading a json file
    if (config.type === 'json')
      return getFile(value, baseDir)
        .then((data) => JSON.parse(data))
        .then((data) => result[name] = data);
  }
}

//Gets a file by checking it relative to relativeTo -
// if that fails we try it direct. This is because we
// cannot make assumptions about whether the user
// specifies files as absolute or relative paths.
function getFile(file, relativeTo='') {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(relativeTo, file), "utf-8", (error, data) => {
      if (!error) return resolve(data);

      fs.readFile(file, "utf-8", (error, data) => {
        if (error) return reject(error);
        else return resolve(data);
      });
    });
  });
}
