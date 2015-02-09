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

export default class Zygo extends EventEmitter {
  constructor(configFile) {
    this.configFile = configFile;
  }

  //Needs to be called to set Jspm/SystemJS up for module loading.
  initialize() {
    return this.loadConfig()
      .then(() => {
        //Get the package.json directory, set jspm packagepath
        let packageDir = path.dirname(this.config.packageJSON);
        jspm.setPackagePath(packageDir);

        // just a hack for now, set up builder and configure jspm
        // the substr('file:'...) is due to baseURL being prepended with file: by jspm
        return jspm.configureLoader()
          .then((cfg) => this.baseURL = cfg.baseURL.substr('file:'.length))
          .then(() => builder.loadConfig(path.resolve(this.baseURL, 'config.js')))
          .then(() => builder.config({  baseURL: 'file:' + this.baseURL }))
          .then(() => global.System = builder.loader)
          .then(() => jspm.import(this.config.routes))
          .then((module) => module.default)
          .then(Config.desugarRoutes)
          .then((routes) => this.routes = routes);
      });
  }

  //Reload the configuration.
  loadConfig() {
    return Config.parse(this.configFile)
      .then((config) => {
        this.config = config;
      });
  }

  //Create a server instance, listen on default port.
  createServer(port) {
    return Promise.resolve()
      .then(() => Server.createServer(this))
      .then((server) => server.listen(port || this.config.port));
  }

  //Build route bundles
  //Reload config to integrate updates back in.
  bundle() {
    return Build.build(this)
      .then(this.loadConfig.bind(this));
  }

  //Unbundle app.
  //Reload config to integrate updates back in.
  unbundle() {
    return Build.unbuild(this)
      .then(this.loadConfig.bind(this));
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    let match;
    return Promise.resolve()
      .then(() => {
        match = Routes.match(path, this.routes);
        if (!match) throw new Error("No default or matching route for path: " + path);

        //Initialise context
        let context =  {
          meta: {},
          loadingRequest: {
            routes: match.routes,
            path: path,
            options: match.options,
            headers: headers,
            method: requestMethod
          }
        };

        //Attach default context options to context
        Object.keys(this.config.defaultContext).map((key) => {
          context[key] = this.config.defaultContext[key];
        });

        return Routes.runHandlers(match.routes, context);
      })
      .then((context) => Render.renderRoutes(match.routes, context))
      .then((renderObject) => Render.renderPage(renderObject, this))

      //catch redirects, else rethrow the error if we don't know it.
      .catch((error) => {
        if (error instanceof Routes.RouteRedirect) return this.route(error.redirect, headers, requestMethod);
        else throw error;
      });
  }
}
