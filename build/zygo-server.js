"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $__config__,
    $__render__,
    $__build__,
    $__routes__,
    $__server__,
    $__jspm__,
    $__systemjs_45_builder__,
    $__path__,
    $__fs__,
    $__events__;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__});
var Render = ($__render__ = require("./render"), $__render__ && $__render__.__esModule && $__render__ || {default: $__render__});
var Build = ($__build__ = require("./build"), $__build__ && $__build__.__esModule && $__build__ || {default: $__build__});
var Routes = ($__routes__ = require("./routes"), $__routes__ && $__routes__.__esModule && $__routes__ || {default: $__routes__});
var Server = ($__server__ = require("./server"), $__server__ && $__server__.__esModule && $__server__ || {default: $__server__});
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var Events = ($__events__ = require("events"), $__events__ && $__events__.__esModule && $__events__ || {default: $__events__}).default;
var EventEmitter = Events.EventEmitter;
var Zygo = function Zygo(configFile) {
  this.configFile = configFile;
};
($traceurRuntime.createClass)(Zygo, {
  initialize: function() {
    var $__5 = this;
    return this.loadConfig().then((function() {
      var packageDir = path.dirname($__5.config.packageJSON);
      jspm.setPackagePath(packageDir);
      return jspm.configureLoader().then((function(cfg) {
        return $__5.baseURL = cfg.baseURL.substr('file:'.length);
      })).then((function() {
        return builder.loadConfig(path.resolve($__5.baseURL, 'config.js'));
      })).then((function() {
        return builder.config({baseURL: 'file:' + $__5.baseURL});
      })).then((function() {
        return global.System = builder.loader;
      })).then((function() {
        return jspm.import($__5.config.routes);
      })).then((function(module) {
        return module.default;
      })).then(Config.desugarRoutes).then((function(routes) {
        return $__5.routes = routes;
      }));
    }));
  },
  loadConfig: function() {
    var $__5 = this;
    return Config.parse(this.configFile).then((function(config) {
      $__5.config = config;
    }));
  },
  createServer: function(port) {
    var $__5 = this;
    return Promise.resolve().then((function() {
      return Server.createServer($__5);
    })).then((function(server) {
      return server.listen(port || $__5.config.port);
    }));
  },
  bundle: function() {
    return Build.build(this).then(this.loadConfig.bind(this));
  },
  unbundle: function() {
    return Build.unbuild(this).then(this.loadConfig.bind(this));
  },
  route: function(path, headers, requestMethod) {
    var $__5 = this;
    var match;
    return Promise.resolve().then((function() {
      match = Routes.match(path, $__5.routes);
      if (!match)
        throw new Error("No default or matching route for path: " + path);
      var context = {
        meta: {},
        loadRoute: {
          routes: match.routes,
          path: path,
          headers: headers,
          method: requestMethod
        }
      };
      Object.keys(match.options).map((function(key) {
        if (key == 'path' || key == 'routes' || key == 'headers' || key == 'method')
          throw new Error("Invalid option id in route path: :" + key);
        context.loadRoute[key] = match.options[key];
      }));
      Object.keys($__5.config.defaultContext).map((function(key) {
        context[key] = $__5.config.defaultContext[key];
      }));
      return Routes.runHandlers(match.routes, context);
    })).then((function(context) {
      return Render.renderRoutes(match.routes, context);
    })).then((function(renderObject) {
      return Render.renderPage(renderObject, $__5);
    })).catch((function(error) {
      if (error instanceof Routes.RouteRedirect)
        return $__5.route(error.redirect, headers, requestMethod);
      else
        throw error;
    }));
  }
}, {}, EventEmitter);
var $__default = Zygo;
//# sourceURL=zygo-server.js