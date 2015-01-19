import urlPattern from 'url-pattern';
import jspm from 'jspm';
import Events from 'events';
import Config from './config';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import * as Render from './render';
import * as Build from './build';
import createServer from './server';
import builder from 'systemjs-builder';
var {EventEmitter} = Events;

//TODO:
//             zygo should really not be a class when it uses modules internally
//                     the problem is that there will be clashes if people think they can
//                     create multiple independant zygo instances. I'd like to support this
//                     in the future (how do I host multiple separate apps? etc) but for now.

class TransitionAborted extends Error {}

export default class Zygo extends EventEmitter {
  constructor(configFile) {
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

        this.config.packageDir = packageDir;

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
  _cssTrace(moduleName) {
    return this._trace(moduleName)
      .then((trace) => {
        //console.log(Object.keys(builder.loader.loads))
        return Object.keys(builder.loader.loads)
           .map((key) => builder.loader.loads[key].address)
           .filter((address) => !!address.match('\\.css$'))
           .map((address) => address.substr(('file:' + this.baseURL).length));
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
      });
  }

  //matches a given route and returns route object
  // throws an exception if no route is matched
  //runs the route handlers
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
      let handlers = _this.routes[routeString];
      if (!(handlers instanceof Array)) handlers = [handlers];

      let loadingRoute = {
        //route request state
        state: {},

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

      return _this._runHandlers(loadingRoute).then((result) => {
        loadingRoute.title = result.title;
        loadingRoute.component = result.component;

        return loadingRoute;
      });
    }
  }

  _runHandlers(loadingRoute) {
    return loadingRoute.handlers.reduce((handlerChain, nextHandler) => {
      return handlerChain
        .then((result) => {
        return new Promise((resolve, reject) => {
          //Handler redirected, rerun with new route.
          if (result && result.redirect) return resolve(route(result.redirect));

          //Handler returned a component to be rendered
          if (result && result.component) return resolve(result);

          //TODO don't like this whole force default business
          // shared also, figure that out
          return resolve(jspm.import(nextHandler)
            .then((handlerModule) => handlerModule.default(loadingRoute.state, loadingRoute)));
        });
      });
    }, Promise.resolve());
  }
}
