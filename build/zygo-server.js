"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $__jspm__,
    $__events__,
    $__config__,
    $__path__;
var Jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var Events = ($__events__ = require("events"), $__events__ && $__events__.__esModule && $__events__ || {default: $__events__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var EventEmitter = Events.EventEmitter;
var TransitionAborted = function TransitionAborted() {
  $traceurRuntime.superConstructor($TransitionAborted).apply(this, arguments);
};
var $TransitionAborted = TransitionAborted;
($traceurRuntime.createClass)(TransitionAborted, {}, {}, Error);
var Zygo = function Zygo(configFile) {
  this.currentPath = '';
  this.config = new Config(configFile);
  var configDir = path.dirname(this.config.configPath);
  process.chdir(configDir);
  Jspm.configureLoader();
};
($traceurRuntime.createClass)(Zygo, {
  initialise: function() {
    return this.config.parse();
  },
  route: function(path, headers, requestType) {},
  renderComponent: function(component) {
    var title = arguments[1];
    return System.import(component).then(function(componentModule) {
      var container = document.getElementById('__zygo-body-container__');
      var element = React.createElement(componentModule.default, state);
      React.render(element, container);
      var titleTag = document.getElementsByTagName('title');
      if (titleTag[0])
        titleTag[0].innerHTML = title;
    });
  },
  pushState: function(path) {
    var headers = arguments[1] !== (void 0) ? arguments[1] : {};
    return _getRouteObject(path, headers).then(_setMetadata);
  },
  _renderLoadingRoute: function(loadingRoute) {
    return new Promise((function(resolve, reject) {
      if (currentPath !== loadingRoute.path)
        return reject(new TransitionAborted());
      refresh(loadingRoute).then(function() {
        resolve(loadingRoute);
      });
    }));
  },
  _getRouteObject: function(path) {
    var headers = arguments[1] !== (void 0) ? arguments[1] : {};
    var $__7 = function(routeString) {
      var pattern = urlPattern.newPattern(routeString);
      var match = pattern.match(path);
      if (match) {
        var handlers = routes[routeString];
        if (!(handlers instanceof Array))
          handlers = [handlers];
        currentPath = path;
        var loadingRoute = {
          title: undefined,
          component: undefined,
          path: path,
          handlers: handlers,
          options: match,
          headers: headers,
          method: 'GET'
        };
        return {v: _runHandlers(loadingRoute).then(function(result) {
            loadingRoute.title = result.title;
            loadingRoute.component = result.component;
            return loadingRoute;
          })};
      }
    },
        $__8;
    for (var routeString in routes) {
      $__8 = $__7(routeString);
      if (typeof $__8 === "object")
        return $__8.v;
    }
    throw new Error("No matching server-side route for " + path);
  },
  _runHandlers: function(loadingRoute) {
    return loadingRoute.handlers.reduce(function(handlerChain, nextHandler) {
      return handlerChain.then(function(result) {
        var $__4 = this;
        return new Promise((function(resolve, reject) {
          if (result && result.redirect)
            return resolve(route(result.redirect));
          if (result && result.component)
            return resolve(result);
          if ($__4.currentPath !== loadingRoute.path)
            return reject(new TransitionAborted());
        }));
      });
    }, Promise.resolve());
  },
  _setMetadata: function(loadingRoute) {
    var $__4 = this;
    return new Promise((function(resolve, reject) {
      if ($__4.currentPath !== loadingRoute.path)
        return reject(new TransitionAborted());
      state.route = loadingRoute;
      resolve();
    }));
  }
}, {}, EventEmitter);
var $__default = Zygo;
//# sourceURL=zygo-server.js