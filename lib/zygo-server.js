import urlPattern from 'url-pattern';
import jspm from 'jspm';
import Events from 'events';
import Config from './config';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import * as Render from './render';
import builder from 'systemjs-builder';
var {EventEmitter} = Events;

class TransitionAborted extends Error {}

export default class Zygo extends EventEmitter {
  constructor(configFile) {
    this.currentPath = '';

    this.state = {
      route: {}
    };

    this.config = new Config(configFile);
  }

  //Needs to be called to set Jspm/SystemJS up for module loading.
  initialise() {
    return this.config.parse()
      .then(() => {
        //Load in the server's routes
        this.routes = {};
        for (let key in this.config.routes) this.routes[key] = this.config.routes[key];
        for (let key in this.config.serverRoutes) this.routes[key] = this.config.serverRoutes[key];

        //Assume the package.json is in the zygo config directory at first
        let packageDir = path.dirname(this.config.configPath);

        //They specified another location, so find it.
        if (this.config.packageJSON) {
          //Try a relative require.
          var possibleDir = path.resolve(packageDir, this.config.packageJSON);
          try {
            if (fs.statSync(possibleDir)) packageDir = path.dirname(possibleDir);
          } catch(notFound) {
            //Relative failed, assume it's an absolute path.
            packageDir = path.dirname(this.config.packageDir);
          }
        }

        //set Jspm package path
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

  //Trace the css dependencies of a module
  _cssTrace(moduleName) {
    return this._trace(moduleName)
      .then((trace) => {
        return Object.keys(trace.tree).map((key) => trace.tree[key])
          .filter((leaf) => !!leaf.name.match('\\.css!'))
          .map((css) => css.metadata.pluginArgument);
      });
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    return _getRouteObject(path, headers, requestMethod)
      .then((loadingRoute) => Render.renderComponent(loadingRoute.component, this.state))
      .then((templateElements) => {
        
      });
  }

  //matches a given route and returns route object
  // throws an exception if no route is matched
  //runs the route handlers
  _getRouteObject(path, headers={}, requestMethod="GET") {
    for (let routeString in this.routes) {
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
