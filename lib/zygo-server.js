import urlPattern from 'url-pattern';
import jspm from 'jspm';
import Events from 'events';
import Config from './config';
import path from 'path';
import * as Render from './render';
import builder from 'systemjs-builder';
var {EventEmitter} = Events;

class TransitionAborted extends Error {}

export default class Zygo extends EventEmitter {
  constructor(configFile) {
    this.currentPath = '';
    this.config = new Config(configFile);
  }

  //Needs to be called to set Jspm/SystemJS up for module loading.
  initialise() {
    return this.config.parse()
      .then(() => {
        //Set Jspm up for importing their files
        let packageDir = path.dirname(this.config.packageJSON || this.config.configPath);
        jspm.setPackagePath(packageDir);

        // NB support custom configFile in package.json
        // just a hack for now
        return builder.loadConfig(path.resolve(packageDir, 'config.js'))
          .then(() => builder.config({  baseURL: 'file:' + packageDir }));
      });
  }

  //Get trace instance from the SystemJS builder given a module
  _trace(moduleName) {
    return builder.trace(moduleName);
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    return _getRouteObject(path, headers, requestMethod)
      .then((loadingRoute) => {
        return Render.renderComponent(loadingRoute.component, this.state);
      })
      .then((templateElements) => {
      //RENDER THE TEMPLATE
      });
  }

  //matches a given route and returns route object
  // throws an exception if no route is matched
  //runs the route handlers
  _getRouteObject(path, headers={}, requestMethod="GET") {
    //TODO: stache/cache this?
    var key, routes = {};
    for (key in config.routes) routes[key] = config.routes[key];
    for (key in config.serverRoutes) routes[key] = config.serverRoutes[key];

    for (let routeString in routes) {
      let  pattern = urlPattern.newPattern(routeString);
      let match = pattern.match(path);

      if (match) {
        let handlers = routes[routeString];
        if (!(handlers instanceof Array)) handlers = [handlers];

        let loadingRoute = {
          //returned by handlers, hence we get these later
          title: undefined,
          component: undefined,

          //already know these
          path: path,
          handlers: handlers,
          options: match,
          headers: headers,
          method: requestMethod
        };

        return _runHandlers(loadingRoute).then(function(result) {
          loadingRoute.title = result.title;
          loadingRoute.component = result.component;

          return loadingRoute;
        });
      }
    }

    //No match!
    throw new Error("No matching server-side route for " + path);
  }

  _runHandlers(loadingRoute) {
    return loadingRoute.handlers.reduce(function(handlerChain, nextHandler) {
      return handlerChain.then(function(result) {
        return new Promise((resolve, reject) => {
          //Handler redirected, rerun with new route.
          if (result && result.redirect) return resolve(route(result.redirect));

          //Handler returned a component to be rendered
          if (result && result.component) return resolve(result);

          //If another transition has occured and this one is no longer valid,
          // we early out to avoid rendering conflicts and other issues.
          if (this.currentPath !== loadingRoute.path) return reject(new TransitionAborted());

          //TODO don't like this whole force default business
          // shared also, figure that out
          return resolve(Jspm.import(nextHandler).then(function(handlerModule) {
            return handlerModule.default(state, loadingRoute);
          }));
        });
      });
    }, Promise.resolve());
  }
}
