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
    $__handlebars__,
    $__path__,
    $__fs__,
    $__config__,
    $__render__,
    $__build__,
    $__server__,
    $__systemjs_45_builder__;
var urlPattern = ($__url_45_pattern__ = require("url-pattern"), $__url_45_pattern__ && $__url_45_pattern__.__esModule && $__url_45_pattern__ || {default: $__url_45_pattern__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var Events = ($__events__ = require("events"), $__events__ && $__events__.__esModule && $__events__ || {default: $__events__}).default;
var Handlebars = ($__handlebars__ = require("handlebars"), $__handlebars__ && $__handlebars__.__esModule && $__handlebars__ || {default: $__handlebars__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__});
var Render = ($__render__ = require("./render"), $__render__ && $__render__.__esModule && $__render__ || {default: $__render__});
var Build = ($__build__ = require("./build"), $__build__ && $__build__.__esModule && $__build__ || {default: $__build__});
var createServer = ($__server__ = require("./server"), $__server__ && $__server__.__esModule && $__server__ || {default: $__server__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var EventEmitter = Events.EventEmitter;
var RouteRedirect = function RouteRedirect(redirect) {
  this.redirect = redirect;
};
($traceurRuntime.createClass)(RouteRedirect, {}, {}, Error);
var Zygo = function Zygo(configFile) {
  this.configFile = configFile;
};
($traceurRuntime.createClass)(Zygo, {
  initialise: function() {
    var $__8 = this;
    return Config.parse(this.configFile).then((function(config) {
      $__8.config = config;
      $__8.routes = {};
      for (var key in $__8.config.routes)
        $__8.routes[key] = $__8.config.routes[key];
      for (var key$__11 in $__8.config.serverRoutes)
        $__8.routes[key$__11] = $__8.config.serverRoutes[key$__11];
      var packageDir = path.dirname($__8.config.packageJSON);
      jspm.setPackagePath(packageDir);
      return jspm.configureLoader().then((function(cfg) {
        return $__8.baseURL = cfg.baseURL.substr('file:'.length);
      })).then((function() {
        return builder.loadConfig(path.resolve($__8.baseURL, 'config.js'));
      })).then((function() {
        return builder.config({baseURL: 'file:' + $__8.baseURL});
      }));
    }));
  },
  _trace: function(moduleName) {
    return builder.trace(moduleName);
  },
  _cssTrace: function(moduleName) {
    var $__8 = this;
    return this._trace(moduleName).then((function(trace) {
      return Object.keys(builder.loader.loads).map((function(key) {
        return builder.loader.loads[key].address;
      })).filter((function(address) {
        return !!address.match('\\.css$');
      })).map((function(address) {
        return path.relative($__8.baseURL, address.substr('file:'.length));
      }));
    }));
  },
  createServer: function() {
    return createServer(this).listen(this.config.port);
  },
  build: function() {
    return Build.build(this);
  },
  route: function(path, headers, requestMethod) {
    var $__8 = this;
    return this._getRouteObject(path, headers, requestMethod).then((function(loadingRoute) {
      return Render.renderRoute(loadingRoute, $__8);
    })).then((function(templateElements) {
      var template = Handlebars.compile($__8.config.template);
      return template(templateElements);
    })).catch((function(error) {
      if (error instanceof RouteRedirect)
        return route(error.redirect, headers, requestMethod);
      throw error;
    }));
  },
  _getRouteObject: function(path) {
    var headers = arguments[1] !== (void 0) ? arguments[1] : {};
    var requestMethod = arguments[2] !== (void 0) ? arguments[2] : "GET";
    var _this = this;
    for (var routeString in this.routes) {
      var pattern = urlPattern.newPattern(routeString);
      var match = pattern.match(path);
      if (match)
        return _handleMatch(routeString);
    }
    if (this.routes.default)
      return _handleMatch('default');
    return Promise.reject(new Error("No matching server-side route for " + path));
    function _handleMatch(routeString) {
      var handler = _this.routes[routeString];
      var loadingRoute = {
        state: {},
        meta: undefined,
        component: undefined,
        path: path,
        handler: handler,
        options: match,
        headers: headers,
        method: requestMethod
      };
      return runHandler(loadingRoute).then((function(meta) {
        if (meta.redirect)
          throw new RouteRedirect(meta.redirect);
        loadingRoute.meta = meta;
      })).then((function() {
        return loadingRoute;
      }));
    }
  }
}, {}, EventEmitter);
var $__default = Zygo;
function runHandler(loadingRoute) {
  return Promise.resolve().then((function() {
    if (typeof loadingRoute.handler === "object")
      return loadingRoute.handler;
    return jspm.import(loadingRoute.handler);
  })).then((function(handlerModule) {
    loadingRoute.component = handlerModule.component;
    if (handlerModule.handler)
      return handlerModule.handler(loadingRoute.state, loadingRoute);
    else
      return handlerModule.meta ? handlerModule.meta : {};
  }));
}
//# sourceURL=zygo-server.js