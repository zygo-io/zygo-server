"use strict";
Object.defineProperties(exports, {
  match: {get: function() {
      return match;
    }},
  runHandlers: {get: function() {
      return runHandlers;
    }},
  __esModule: {value: true}
});
var $__url_45_pattern__,
    $__jspm__;
var pattern = ($__url_45_pattern__ = require("url-pattern"), $__url_45_pattern__ && $__url_45_pattern__.__esModule && $__url_45_pattern__ || {default: $__url_45_pattern__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
function match(path, routes) {
  var result = _match(path, '', routes);
  if (!result)
    return null;
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
  if (Object.keys(childRoutes).length === 0) {
    var match$__2 = pattern.newPattern(curPattern).match(path);
    if (match$__2 !== null) {
      otherParams.options = match$__2;
      return [otherParams];
    } else
      return null;
  }
  var match = null;
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
  var result = {context: {}};
  return routes.reduce((function(chain, route) {
    return chain.then((function() {
      return route.handler ? jspm.import(route.handler) : null;
    })).then((function(module) {
      return module ? module.handler(result.context) : {};
    })).then((function(state) {
      return result[route.path] = state;
    }));
  }), Promise.resolve()).then((function() {
    return result;
  }));
}
//# sourceURL=routes.js