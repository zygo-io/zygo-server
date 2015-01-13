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

    //Set Jspm up for importing their files.
    // We make the assumption that their zygo.json is in the same dir as their
    // package.json, I believe. Unless Jspm does some magic to find it.
    let configDir =  path.dirname(this.config.configPath);
    process.chdir(configDir);
    Jspm.configureLoader();
  }

  //The 'asynchronous' part of the constructor.
  initialise() {
    return this.config.parse();
  }

  //Match route, render and return HTML.
  route(path, headers, requestType) {

  }

  renderComponent(component, title=undefined) {
    return System.import(component).then(function(componentModule) {
      let container = document.getElementById('__zygo-body-container__');
      let element = React.createElement(componentModule.default, state);

      React.render(element, container);

      //There can only be one title tag by the HTML5 standard,
      // so this is an acceptable solution.
      var titleTag = document.getElementsByTagName('title');
      if (titleTag[0]) titleTag[0].innerHTML = title;
    });
  }

  //Sets the routes object as if the given request occured
  pushState(path, headers={}) {
    return _getRouteObject(path,  headers).then(_setMetadata);
  }

  //render given route if the route path has not changed
  _renderLoadingRoute(loadingRoute) {
    return new Promise((resolve, reject) => {
      //Early out if another transition has taken priority
      if (currentPath !== loadingRoute.path) return reject(new TransitionAborted());

      refresh(loadingRoute).then(function() {
        resolve(loadingRoute);
      });
    });
  }

  //matches a given route and returns route object
  // throws an exception if no route is matched
  //runs the route handlers
  _getRouteObject(path, headers={}) {
    for (let routeString in routes) {
      let  pattern = urlPattern.newPattern(routeString);
      let match = pattern.match(path);

      if (match) {
        let handlers = routes[routeString];
        if (!(handlers instanceof Array)) handlers = [handlers];

        //The path we are transitioning to.
        currentPath = path;

        let loadingRoute = {
          //returned by handlers, hence we get these later
          title: undefined,
          component: undefined,

          //already know these
          path: path,
          handlers: handlers,
          options: match,
          headers: headers,
          method: 'GET'
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
        });
      });
    }, Promise.resolve());
  }

  //Swap loading route into state.route.
  _setMetadata(loadingRoute) {
    return new Promise((resolve, reject) => {
      //If transition has changed, don't swap this route in.
      if (this.currentPath !== loadingRoute.path) return reject(new TransitionAborted());

      //Finished loading route, swap it into current state.
      state.route = loadingRoute;

      resolve();
    });
  }
}
