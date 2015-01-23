"use strict";
Object.defineProperties(exports, {
  match: {get: function() {
      return match;
    }},
  __esModule: {value: true}
});
var $__url_45_pattern__;
var pattern = ($__url_45_pattern__ = require("url-pattern"), $__url_45_pattern__ && $__url_45_pattern__.__esModule && $__url_45_pattern__ || {default: $__url_45_pattern__}).default;
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
    var match$__1 = pattern.newPattern(curPattern).match(path);
    if (match$__1 !== null) {
      otherParams.options = match$__1;
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
//# sourceURL=routes.js