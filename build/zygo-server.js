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
var RouteRedirect = function RouteRedirect(redirect) {
  this.redirect = redirect;
};
($traceurRuntime.createClass)(RouteRedirect, {}, {}, Error);
var Zygo = function Zygo(configFile) {
  this.configFile = configFile;
};
($traceurRuntime.createClass)(Zygo, {
  initialize: function() {
    var $__5 = this;
    return Config.parse(this.configFile).then((function(config) {
      $__5.config = config;
      Config.desugarRoutes($__5.config.routes);
      var packageDir = path.dirname($__5.config.packageJSON);
      jspm.setPackagePath(packageDir);
      return jspm.configureLoader().then((function(cfg) {
        return $__5.baseURL = cfg.baseURL.substr('file:'.length);
      })).then((function() {
        return builder.loadConfig(path.resolve($__5.baseURL, 'config.js'));
      })).then((function() {
        return builder.config({baseURL: 'file:' + $__5.baseURL});
      }));
    }));
  },
  createServer: function(port) {
    var $__5 = this;
    return Promise.resolve().then((function() {
      return Server.createServer($__5).listen(port || $__5.config.port);
    }));
  },
  build: function() {
    return Build.build(this);
  },
  route: function(path, headers, requestMethod) {
    var $__5 = this;
    var match;
    return Promise.resolve().then((function() {
      match = Routes.match(path, $__5.config.routes);
      if (!match)
        throw new Error("No default or matching route for path: " + path);
      var context = {
        meta: {},
        loadingRequest: {
          routes: match.routes,
          path: path,
          options: match.options,
          headers: headers,
          method: requestMethod
        }
      };
      return Routes.runHandlers(match.routes, context);
    })).then((function(context) {
      return Render.renderRoutes(match.routes, context);
    })).then((function(renderObject) {
      return Render.renderPage(renderObject, $__5);
    }));
  }
}, {}, EventEmitter);
var $__default = Zygo;
//# sourceURL=zygo-server.js