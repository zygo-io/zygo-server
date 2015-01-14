"use strict";
Object.defineProperties(exports, {
  renderComponent: {get: function() {
      return renderComponent;
    }},
  __esModule: {value: true}
});
var $__react__,
    $__jspm__,
    $__fs__;
var React = ($__react__ = require("react"), $__react__ && $__react__.__esModule && $__react__ || {default: $__react__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
function renderComponent(component, zygo) {
  var result = {
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null,
    zygoTitle: zygo.state.route.title
  };
  return Promise.resolve().then((function() {
    return getBody();
  })).then((function(body) {
    return result.zygoBody = body;
  })).then((function() {
    return getHeader();
  })).then((function(header) {
    return result.zygoHeader = header;
  })).then((function() {
    return getFooter();
  })).then((function(footer) {
    return result.zygoFooter = footer;
  })).then((function() {
    return result;
  }));
  function getHeader() {
    var result = '<script src="jspm_packages/system.js"></script>\n' + '<script src="config.js"></script>\n';
    return Promise.resolve().then((function() {
      return zygo._cssTrace(component);
    })).then((function(trace) {
      trace.map((function(css) {
        result += '<link rel="stylesheet" type="text/css" href="' + css + '"></link>\n';
      }));
    })).then((function() {
      return result;
    }));
  }
  function getBody() {
    return Promise.resolve().then((function() {
      return jspm.import(component);
    })).then((function(componentModule) {
      var element = React.createElement(componentModule.default, zygo.state);
      var html = React.renderToString(element);
      return '<div id="__zygo-body-container__">\n' + html + '\n</div>';
    }));
  }
  function getFooter() {
    var result = '<script>\n' + ' System.import("zygo").then(function(zygo) {\n' + '   zygo._setInitialState(';
    return Promise.resolve().then((function() {
      zygo.emit('serialize');
      result += JSON.stringify(zygo.state);
      zygo.emit('deserialize');
      result += ');\n' + '   zygo._setRoutes(';
    })).then((function() {
      var routes = {};
      for (var key in zygo.config.routes)
        routes[key] = zygo.config.routes[key];
      for (var key$__3 in zygo.config.clientRoutes)
        routes[key$__3] = zygo.config.clientRoutes[key$__3];
      result += JSON.stringify(routes);
      result += ');\n' + '   zygo._addLinkHandlers();\n' + ' });\n' + '</script>';
      return result;
    }));
  }
}
//# sourceURL=render.js