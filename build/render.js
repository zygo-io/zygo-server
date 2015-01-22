"use strict";
Object.defineProperties(exports, {
  renderRoute: {get: function() {
      return renderRoute;
    }},
  __esModule: {value: true}
});
var $__react__,
    $__jspm__,
    $__fs__,
    $__handlebars__;
var React = ($__react__ = require("react"), $__react__ && $__react__.__esModule && $__react__ || {default: $__react__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var Handlebars = ($__handlebars__ = require("handlebars"), $__handlebars__ && $__handlebars__.__esModule && $__handlebars__ || {default: $__handlebars__}).default;
function renderRoute(route, zygo) {
  var result = {
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null,
    zygoMeta: route.meta
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
    var template = Handlebars.compile(zygo.config.zygoHeader);
    return Promise.resolve().then((function() {
      return zygo._cssTrace(route.component);
    })).then((function(stylesheets) {
      return template({stylesheets: stylesheets});
    }));
  }
  function getBody() {
    var template = Handlebars.compile(zygo.config.zygoBody);
    return Promise.resolve().then((function() {
      return jspm.import(route.component);
    })).then((function(componentModule) {
      var element = React.createElement(componentModule.default, route.state);
      var html = React.renderToString(element);
      return template({html: html});
    }));
  }
  function getFooter() {
    var template = Handlebars.compile(zygo.config.zygoFooter);
    return Promise.resolve().then((function() {
      route.state.route = {
        component: route.component,
        meta: route.meta,
        path: route.path,
        handlers: route.handlers,
        options: route.match,
        headers: route.headers,
        method: route.requestMethod
      };
      var clientRoutes = {};
      for (var key in zygo.config.routes)
        clientRoutes[key] = zygo.config.routes[key];
      for (var key$__4 in zygo.config.clientRoutes)
        clientRoutes[key$__4] = zygo.config.clientRoutes[key$__4];
      var templateObject = {
        path: route.path,
        state: JSON.stringify(route.state),
        routes: JSON.stringify(clientRoutes),
        addLinkHandlers: zygo.config.anchors
      };
      if (zygo.config.environment === 'production') {
        if (zygo.config.bundlesJSON) {
          templateObject.bundles = fs.readFileSync(zygo.config.bundlesJSON, 'utf-8');
          templateObject.bundleObjects = [];
          var bundleJSON = JSON.parse(templateObject.bundles);
          Object.keys(bundleJSON).map((function(key) {
            if (bundleJSON[key].routes.indexOf(route.path) !== -1)
              templateObject.bundleObjects.push({
                bundle: key,
                modules: bundleJSON[key].modules
              });
          }));
        }
      }
      return template(templateObject);
    }));
  }
}
//# sourceURL=render.js