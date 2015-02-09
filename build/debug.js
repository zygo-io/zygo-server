"use strict";
Object.defineProperties(exports, {
  mode: {get: function() {
      return mode;
    }},
  propagate: {get: function() {
      return propagate;
    }},
  __esModule: {value: true}
});
var $__routes__;
var RouteRedirect = ($__routes__ = require("./routes"), $__routes__ && $__routes__.__esModule && $__routes__ || {default: $__routes__}).RouteRedirect;
var mode = {debugMode: false};
function propagate(msg) {
  return function(error) {
    if (error instanceof RouteRedirect)
      throw error;
    if (mode.debugMode) {
      console.log(msg + error);
    }
    throw error;
  };
}
//# sourceURL=debug.js