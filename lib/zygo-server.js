import * as Config from './config';
import * as Render from './render';
import * as Build from './build';
import * as Routes from './routes';
import * as Server from './server';
import * as Debug from './debug';
import jspm from 'jspm';
import builder from './systemjs-builder';
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
        process.chdir(packageDir);
        jspm.setPackagePath(packageDir);

        // just a hack for now, set up builder and configure jspm
        // the substr('file:'...) is due to baseURL being prepended with file: by jspm
        return jspm.configureLoader()
          .then((cfg) => this.baseURL = cfg.baseURL.substr('file:'.length))
          .then(() => builder.loadConfig(path.resolve(this.baseURL, 'config.js')))
          .then(() => builder.config({  baseURL: 'file:' + this.baseURL }))
          .then(() => global.System = builder.loader)
          .then(() => Config.desugarRoutes(this.config.routes))
          .then((routes) => this.routes = routes)
          .catch(Debug.propagate("Error configuring jspm: "));
      });
  }

  //Reload the configuration.
  loadConfig() {
    return Config.parse(this.configFile)
      .then((config) => {
        this.config = config;
      })
      .catch(Debug.propagate("Error loading config: "));
  }

  //Create a server instance, listen on default port.
  createServer(port) {
    return Promise.resolve()
      .then(() => Server.createServer(this))
      .then((server) => server.listen(port || this.config.port))
      .catch(Debug.propagate("Error creating server: "));
  }

  //Build route bundles
  //Reload config to integrate updates back in.
  bundle() {
    return Build.build(this)
      .then(this.loadConfig.bind(this))
      .catch(Debug.propagate("Error bundling app: "));
  }

  //Unbundle app.
  //Reload config to integrate updates back in.
  unbundle() {
    return Build.unbuild(this)
      .then(this.loadConfig.bind(this))
      .catch(Debug.propagate("Error unbundling app: "));
  }

  //Set debug mode on
  setDebugMode(mode=true) {
    Debug.mode.debugMode = mode;
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    //We only support GET requests, else we 404
    if (requestMethod != "GET") {
      return new RouteRedirect({
        status: 404,
        message: requestMethod + " not supported"
      });
    }

    //Match all routes that fit the path
    let matches = Routes.match(path, this.routes);

    //Initialise context
    let context = {
      request: {
        headers: headers,
        method: requestMethod
      },

      loadRoute: {
        path: path
      }
    };

    let matchIndex = 0;
    return this._route(matches, matchIndex, context);
  }

    //Helper for routing function
  _route(matches, matchIndex, context) {
    let match = matches[matchIndex];

    return Promise.resolve()
      .then(() => {
        //Flatten options directly onto loadRoute object.
        Object.keys(match.options).map((key) => {
          //Reserved words
          if (key == 'path' || key == 'routes' || key == 'headers' || key == 'method')
            throw new Error("Invalid option id in route path: :" + key);

          context.loadRoute[key] = match.options[key];
        });

        //Attach default context options to context
        Object.keys(this.config.defaultContext).map((key) => {
          context[key] = this.config.defaultContext[key];
        });

        return Routes.runHandlers(match.routes, this.config, context);
      })
      .then((context) => {
        //swap out loadRoute into curRoute for rendering
        context.curRoute = context.loadRoute;
        context.loadRoute = undefined;

        return context;
      })
      .then((context) => Render.renderRoutes(match.routes, context))
      .then((renderObject) => Render.renderPage(renderObject, this))

      //catch redirects, else rethrow the error if we don't know it.
      .catch((error) => {
        if (error instanceof Routes.RouteRedirect) {
          //This is a bump to next match redirect, head there.
          if (error.redirect === false) {
            matchIndex++;
            if (matches[matchIndex]) return this._route(matches, matchIndex, context);
            return this.route('default', context.headers, context.requestMethod);
          }

          //This is an error message, head to the default route
          if (error.redirect.status) {
            context.error = {
              status: error.redirect.status,
              message: error.redirect.message
            };

            if (matches[matches.length - 2] && matches[matches.length - 2]._isDefault)
              return this._route(matches, matches.length - 2, context);
            return this._route(matches, matches.length - 1, context);
          }

          //This is a route redirect, head to given path.
          return this.route(error.redirect, context.headers, context.requestMethod);
        }
        else return Debug.propagate("Error in route(): ")(error);
      });
  }
}
