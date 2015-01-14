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
    $__handlebars__,
    $__path__,
    $__fs__,
    $__render__,
    $__systemjs_45_builder__;
var urlPattern = ($__url_45_pattern__ = require("url-pattern"), $__url_45_pattern__ && $__url_45_pattern__.__esModule && $__url_45_pattern__ || {default: $__url_45_pattern__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var Events = ($__events__ = require("events"), $__events__ && $__events__.__esModule && $__events__ || {default: $__events__}).default;
var Config = ($__config__ = require("./config"), $__config__ && $__config__.__esModule && $__config__ || {default: $__config__}).default;
var Handlebars = ($__handlebars__ = require("handlebars"), $__handlebars__ && $__handlebars__.__esModule && $__handlebars__ || {default: $__handlebars__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var Render = ($__render__ = require("./render"), $__render__ && $__render__.__esModule && $__render__ || {default: $__render__});
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var EventEmitter = Events.EventEmitter;
var TransitionAborted = function TransitionAborted() {
  $traceurRuntime.superConstructor($TransitionAborted).apply(this, arguments);
};
var $TransitionAborted = TransitionAborted;
($traceurRuntime.createClass)(TransitionAborted, {}, {}, Error);
var Zygo = function Zygo(configFile) {
  this.state = {route: {}};
  this.config = new Config(configFile);
};
($traceurRuntime.createClass)(Zygo, {
  initialise: function() {
    var $__8 = this;
    return this.config.parse().then((function() {
      $__8.routes = {};
      for (var key in $__8.config.routes)
        $__8.routes[key] = $__8.config.routes[key];
      for (var key$__11 in $__8.config.serverRoutes)
        $__8.routes[key$__11] = $__8.config.serverRoutes[key$__11];
      var packageDir = path.dirname($__8.config.configPath);
      if ($__8.config.packageJSON) {
        var possibleDir = path.resolve(packageDir, $__8.config.packageJSON);
        try {
          if (fs.statSync(possibleDir))
            packageDir = path.dirname(possibleDir);
        } catch (notFound) {
          packageDir = path.dirname($__8.config.packageDir);
        }
      }
      $__8.config.packageDir = packageDir;
      jspm.setPackagePath(packageDir);
      return builder.loadConfig(path.resolve(packageDir, 'config.js')).then((function() {
        return builder.config({baseURL: 'file:' + packageDir});
      }));
    }));
  },
  _trace: function(moduleName) {
    return builder.trace(moduleName);
  },
  _cssTrace: function(moduleName) {
    return this._trace(moduleName).then((function(trace) {
      return Object.keys(trace.tree).map((function(key) {
        return trace.tree[key];
      })).filter((function(leaf) {
        return !!leaf.name.match('\\.css!');
      })).map((function(css) {
        return css.metadata.pluginArgument;
      }));
    }));
  },
  route: function(path, headers, requestMethod) {
    var $__8 = this;
    return this._getRouteObject(path, headers, requestMethod).then((function(loadingRoute) {
      $__8.state.route = loadingRoute;
      return Render.renderComponent(loadingRoute.component, $__8);
    })).then((function(templateElements) {
      var template = Handlebars.compile($__8.config.template);
      return template(templateElements);
    }));
  },
  _getRouteObject: function(path) {
    var headers = arguments[1] !== (void 0) ? arguments[1] : {};
    var requestMethod = arguments[2] !== (void 0) ? arguments[2] : "GET";
    var $__12 = this,
        $__13 = function(routeString) {
          var pattern = urlPattern.newPattern(routeString);
          var match = pattern.match(path);
          if (match) {
            var handlers = $__12.routes[routeString];
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
            return {v: $__12._runHandlers(loadingRoute).then((function(result) {
                loadingRoute.title = result.title;
                loadingRoute.component = result.component;
                return loadingRoute;
              }))};
          }
        },
        $__14;
    for (var routeString in this.routes) {
      $__14 = $__13(routeString);
      if (typeof $__14 === "object")
        return $__14.v;
    }
    throw new Error("No matching server-side route for " + path);
  },
  _runHandlers: function(loadingRoute) {
    var $__8 = this;
    return loadingRoute.handlers.reduce((function(handlerChain, nextHandler) {
      return handlerChain.then((function(result) {
        return new Promise((function(resolve, reject) {
          if (result && result.redirect)
            return resolve(route(result.redirect));
          if (result && result.component)
            return resolve(result);
          return resolve(jspm.import(nextHandler).then((function(handlerModule) {
            return handlerModule.default($__8.state, loadingRoute);
          })));
        }));
      }));
    }), Promise.resolve());
  }
}, {}, EventEmitter);
var $__default = Zygo;
//# sourceURL=zygo-server.js