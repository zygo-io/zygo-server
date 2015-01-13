"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $__url_45_pattern__,
    $__jspm__,
    $__events__,
    $__config__,
    $__path__,
    $__render__,
    $__systemjs_45_builder__;
var urlPattern = ($__url_45_pattern__ = require("url-pattern"), $__url_45_pattern__ && $__url_45_pattern__.__esModule && $__url_45_pattern__ || {default: $__url_45_pattern__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var Events = ($__events__ = require("events"), $__events__ && $__events__.__esModule && $__events__ || {default: $__events__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var Render = ($__render__ = require("./render"), $__render__ && $__render__.__esModule && $__render__ || {default: $__render__});
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var EventEmitter = Events.EventEmitter;
var TransitionAborted = function TransitionAborted() {
  $traceurRuntime.superConstructor($TransitionAborted).apply(this, arguments);
};
var $TransitionAborted = TransitionAborted;
($traceurRuntime.createClass)(TransitionAborted, {}, {}, Error);
var Zygo = function Zygo(configFile) {
  this.currentPath = '';
  this.config = new Config(configFile);
};
($traceurRuntime.createClass)(Zygo, {
  initialise: function() {
    var $__6 = this;
    return this.config.parse().then((function() {
      var packageDir = path.dirname($__6.config.packageJSON || $__6.config.configPath);
      jspm.setPackagePath(packageDir);
      return builder.loadConfig(path.resolve(packageDir, 'config.js')).then((function() {
        return builder.config({baseURL: 'file:' + packageDir});
      }));
    }));
  },
  _trace: function(moduleName) {
    return builder.trace(moduleName);
  },
  route: function(path, headers, requestMethod) {
    var $__6 = this;
    return _getRouteObject(path, headers, requestMethod).then((function(loadingRoute) {
      return Render.renderComponent(loadingRoute.component, $__6.state);
    })).then((function(templateElements) {}));
  },
  _getRouteObject: function(path) {
    var headers = arguments[1] !== (void 0) ? arguments[1] : {};
    var requestMethod = arguments[2] !== (void 0) ? arguments[2] : "GET";
    var key,
        routes = {};
    for (key in config.routes)
      routes[key] = config.routes[key];
    for (key in config.serverRoutes)
      routes[key] = config.serverRoutes[key];
    var $__9 = function(routeString) {
      var pattern = urlPattern.newPattern(routeString);
      var match = pattern.match(path);
      if (match) {
        var handlers = routes[routeString];
        if (!(handlers instanceof Array))
          handlers = [handlers];
        var loadingRoute = {
          title: undefined,
          component: undefined,
          path: path,
          handlers: handlers,
          options: match,
          headers: headers,
          method: requestMethod
        };
        return {v: _runHandlers(loadingRoute).then(function(result) {
            loadingRoute.title = result.title;
            loadingRoute.component = result.component;
            return loadingRoute;
          })};
      }
    },
        $__10;
    for (var routeString in routes) {
      $__10 = $__9(routeString);
      if (typeof $__10 === "object")
        return $__10.v;
    }
    throw new Error("No matching server-side route for " + path);
  },
  _runHandlers: function(loadingRoute) {
    return loadingRoute.handlers.reduce(function(handlerChain, nextHandler) {
      return handlerChain.then(function(result) {
        var $__6 = this;
        return new Promise((function(resolve, reject) {
          if (result && result.redirect)
            return resolve(route(result.redirect));
          if (result && result.component)
            return resolve(result);
          if ($__6.currentPath !== loadingRoute.path)
            return reject(new TransitionAborted());
          return resolve(Jspm.import(nextHandler).then(function(handlerModule) {
            return handlerModule.default(state, loadingRoute);
          }));
        }));
      });
    }, Promise.resolve());
  }
}, {}, EventEmitter);
var $__default = Zygo;
//# sourceURL=zygo-server.js