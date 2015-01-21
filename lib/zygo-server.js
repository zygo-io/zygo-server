import urlPattern from 'url-pattern';
import jspm from 'jspm';
import Events from 'events';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import * as Config from './config';
import * as Render from './render';
import * as Build from './build';
import createServer from './server';
import builder from 'systemjs-builder';
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
  initialise() {
    return Config.parse(this.configFile)
      .then((config) => {
        this.config = config;

        //Load in the server's routes
        this.routes = {};
        for (let key in this.config.routes) this.routes[key] = this.config.routes[key];
        for (let key in this.config.serverRoutes) this.routes[key] = this.config.serverRoutes[key];

        //Get the package.json directory
        let packageDir = path.dirname(this.config.configPath);

        //set Jspm package path
        jspm.setPackagePath(packageDir);

        // just a hack for now
        // the substr('file:'...) is due to baseURL being prepended with file: by jspm
        return jspm.configureLoader()
          .then((cfg) => this.baseURL = cfg.baseURL.substr('file:'.length))
          .then(() => builder.loadConfig(path.resolve(this.baseURL, 'config.js')))
          .then(() => builder.config({  baseURL: 'file:' + this.baseURL }));
      });
  }

  //Get trace instance from the SystemJS builder given a module
  _trace(moduleName) {
    return builder.trace(moduleName);
  }

  //Trace the css dependencies of a module
  //Normalises the paths relative to baseURL.
  _cssTrace(moduleName) {
    return this._trace(moduleName)
      .then((trace) => {
        return Object.keys(builder.loader.loads)
           .map((key) => builder.loader.loads[key].address)
           .filter((address) => !!address.match('\\.css$'))
           .map((address) => path.relative(this.baseURL, address.substr('file:'.length)));
      });
  }

  //expose createServer api
  createServer() {
    return createServer(this).listen(this.config.port);
  }

  //expose build api
  build() {
    return Build.build(this);
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    return this._getRouteObject(path, headers, requestMethod)
      .then((loadingRoute) => {
        return Render.renderRoute(loadingRoute, this);
      })
      .then((templateElements) => {
        var template = Handlebars.compile(this.config.template);
        return template(templateElements);
      })
      .catch((error) => {
        //if it's a redirect, route() handles it, else the error is
        // rethrown for the client.
        if (error instanceof RouteRedirect) return route(error.redirect, headers, requestMethod);
        throw error;
      });
  }

  //matches a given route and returns route object
  // throws an exception if no route is matched
  //runs the route handler
  _getRouteObject(path, headers={}, requestMethod="GET") {
    let _this = this;

    for (let routeString in this.routes) {
      let  pattern = urlPattern.newPattern(routeString);
      let match = pattern.match(path);

      if (match) return _handleMatch(routeString);
    }

    if (this.routes.default) return _handleMatch('default');

    //No match!
    return Promise.reject(new Error("No matching server-side route for " + path));

    function _handleMatch(routeString) {
      let handler = _this.routes[routeString];

      let loadingRoute = {
        //route request state
        state: {},

        //returned by handler
        meta: undefined,
        component: undefined,

        //already know these
        path: path,
        handlers: handler,
        options: match,
        headers: headers,
        method: requestMethod
      };

      return jspm.import(handler)
        .then((handlerModule) => {
          loadingRoute.component = handlerModule.component;

          if (handlerModule.handler)
            return handlerModule.handler(loadingRoute.state, loadingRoute);
          else
            return {};
        })
        .then((meta) => {
          if (meta.redirect) throw new RouteRedirect(meta.redirect);
          loadingRoute.meta = meta;
        })
        .then(() => loadingRoute);
    }
  }
}
