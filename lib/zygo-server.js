import urlPattern from 'urlPattern';
import React from 'react';
import Jspm from 'jspm';
import Events from 'events';
import Config from './config';
import path from 'path';
var {EventEmitter} = Events;

class TransitionAborted extends Error {}

export default class Zygo extends EventEmitter {
  constructor(configFile) {
    this.currentPath = '';
    this.config = new Config(configFile);
  }

  //The 'asynchronous' part of the constructor.
  initialise() {
    return this.config.parse()
      .then(() => {
        //Set Jspm up for importing their files
        let packageDir = path.dirname(this.config.packageJSON || this.config.configPath);
        Jspm.setPackagePath(packageDir);
        return Jspm.import('lib/zygo-client');

        //Running into issues getting Jspm to import things correctly. TODO
      });
  }

  //Match route, render and return HTML.
  route(path, headers, requestMethod) {
    return _getRouteObject(path, headers, requestMethod).then((loadingRoute) => {
      return renderComponent(loadingRoute.component, loadingRoute.title);
    }).then(function(templateElements) {
      //RENDER THE TEMPLATE
    });
  }

  //Return title, header, footer and body for the component and title passed in,
  // if a user wants to do their own thing with the templating.
  renderComponent(component, title=undefined) {
    //do zah rendering mon TODO
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
          // return resolve(System.import(nextHandler).then(function(handlerModule) {
          //   return handlerModule.default(state, loadingRoute);
          // }));
          resolve();
        });
      });
    }, Promise.resolve());
  }
}
