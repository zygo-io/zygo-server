"use strict";
Object.defineProperties(exports, {
  RouteRedirect: {get: function() {
      return RouteRedirect;
    }},
  match: {get: function() {
      return match;
    }},
  runHandlers: {get: function() {
      return runHandlers;
    }},
  getHandler: {get: function() {
      return getHandler;
    }},
  __esModule: {value: true}
});
var $__path__,
    $__url_45_pattern__,
    $__jspm__,
    $__systemjs_45_builder__,
    $__debug__;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var pattern = ($__url_45_pattern__ = require("url-pattern"), $__url_45_pattern__ && $__url_45_pattern__.__esModule && $__url_45_pattern__ || {default: $__url_45_pattern__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var Debug = ($__debug__ = require("./debug"), $__debug__ && $__debug__.__esModule && $__debug__ || {default: $__debug__});
var RouteRedirect = function RouteRedirect(redirect) {
  this.redirect = redirect;
};
($traceurRuntime.createClass)(RouteRedirect, {}, {}, Error);
function match(path, routes) {
  var result = _match(path, '', routes);
  if (!result) {
    if (!routes.default)
      return null;
    result = [routes.default];
  }
  var options = result[0].options;
  delete result[0].options;
  return {
    options: options,
    routes: result.reverse()
  };
}
function _match(path, curPattern, curRoute) {
  var childRoutes = {};
  var otherParams = {_path: curPattern};
  Object.keys(curRoute).map((function(key) {
    if (key[0] === '/')
      childRoutes[key] = curRoute[key];
    else
      otherParams[key] = curRoute[key];
  }));
  var match = pattern.newPattern(curPattern || '/').match(path);
  if (match !== null) {
    otherParams.options = match;
    return [otherParams];
  }
  if (pattern.newPattern(curPattern + '(.*)').match(path)) {
    Object.keys(childRoutes).map((function(key) {
      var result = _match(path, curPattern + key, childRoutes[key]);
      if (result) {
        result.push(otherParams);
        match = result;
      }
    }));
  }
  return match;
}
function runHandlers(routes) {
  var context = arguments[1] !== (void 0) ? arguments[1] : {};
  return routes.reduce((function(chain, route) {
    return chain.then((function() {
      return getHandler(route);
    })).then((function(module) {
      return module ? module.default(context) : null;
    })).then((function(result) {
      if (result === false)
        throw new RouteRedirect('default');
      if (result && result.redirect)
        throw new RouteRedirect(result.redirect);
    }));
  }), Promise.resolve()).then((function() {
    return context;
  })).catch(Debug.propagate("Error running handlers in routes.js: "));
}
function getHandler(route) {
  if (!route.component)
    return Promise.resolve();
  var baseURL = builder.loader.baseURL.substr('file:'.length);
  return jspm.import(route.component).then((function(module) {
    return Promise.resolve().then((function() {
      if (module.default.serverHandler) {
        return jspm.normalize(module.default.serverHandler, route.component).then((function(normalized) {
          try {
            return require(path.resolve(baseURL, normalized));
          } catch (_) {
            return jspm.import(normalized);
          }
        }));
      } else
        return null;
    })).then((function(handler) {
      if (handler)
        return handler;
      if (module.default.handler)
        return normalizeAndImport(module.default.handler);
      return null;
    }));
  })).catch(Debug.propagate("Error loading handlers in routes.js: "));
  function normalizeAndImport(handler) {
    if (typeof handler === "function")
      return {default: handler};
    return jspm.normalize(handler, route.component).then((function(normalized) {
      return jspm.import(normalized);
    }));
  }
}
//# sourceURL=routes.js