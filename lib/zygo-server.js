import * as Config from './config';
import * as Render from './render';
import * as Build from './build';
import * as Routes from './routes';
import * as Server from './server';
import jspm from 'jspm';
import builder from 'systemjs-builder';
import path from 'path';
import fs from 'fs';
import Events from 'events';
var {EventEmitter} = Events;

//An error used to indicate a route has been redirected.
class RouteRedirect extends Error {
  constructor(redirect) {
    this.redirect = redirect;
  }
}

export default class Zygo extends EventEmitter {
  constructor(configFile) {
    this.configFile = configFile;
  }

  //Needs to be called to set Jspm/SystemJS up for module loading.
  initialize() {
    return Config.parse(this.configFile)
      .then((config) => {
        this.config = config;

        //Get the package.json directory, set jspm packagepath
        let packageDir = path.dirname(this.config.packageJSON);
        jspm.setPackagePath(packageDir);

        // just a hack for now, set up builder and configure jspm
        // the substr('file:'...) is due to baseURL being prepended with file: by jspm
        return jspm.configureLoader()
          .then((cfg) => this.baseURL = cfg.baseURL.substr('file:'.length))
          .then(() => builder.loadConfig(path.resolve(this.baseURL, 'config.js')))
          .then(() => builder.config({  baseURL: 'file:' + this.baseURL }));
      });
  }

  //Create a server instance, listen on default port.
  createServer() {
    return Server.createServer(this).listen(this.config.port);
  }

  //Build route bundles
  build() {
    return Build.build(this);
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    let match;
    return Promise.resolve()
      .then(() => {
        match = Routes.match(path, this.config.routes);
        if (!match) throw new Error("No default or matching route for path: " + path);

        let context =  {
          meta: {},
          currentRequest: {
            routes: match.routes,
            path: path,
            options: match.options,
            headers: headers,
            method: requestMethod
          }
        };

        return Routes.runHandlers(match.routes, context);
      })
      .then((context) => Render.renderRoutes(match.routes, context))
      .then((renderObject) => Render.renderPage(renderObject, this));
  }
}
