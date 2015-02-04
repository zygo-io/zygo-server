"use strict";
Object.defineProperties(exports, {
  renderComponent: {get: function() {
      return renderComponent;
    }},
  renderRoutes: {get: function() {
      return renderRoutes;
    }},
  renderPage: {get: function() {
      return renderPage;
    }},
  __esModule: {value: true}
});
var $__react__,
    $__jspm__,
    $__systemjs_45_builder__,
    $__fs__,
    $__handlebars__,
    $__routes__;
var React = ($__react__ = require("react"), $__react__ && $__react__.__esModule && $__react__ || {default: $__react__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var Handlebars = ($__handlebars__ = require("handlebars"), $__handlebars__ && $__handlebars__.__esModule && $__handlebars__ || {default: $__handlebars__}).default;
var Routes = ($__routes__ = require("./routes"), $__routes__ && $__routes__.__esModule && $__routes__ || {default: $__routes__});
function renderComponent(path, state) {
  return jspm.import(path).then((function(componentModule) {
    var element = React.createElement(componentModule.default, state);
    return _renderComponent(element, [path]);
  }));
}
function _renderComponent(component) {
  var modulePaths = arguments[1] !== (void 0) ? arguments[1] : [];
  var result = {
    cssTrace: null,
    component: null
  };
  return traceAllCss(modulePaths).then((function(cssTrace) {
    return result.cssTrace = cssTrace;
  })).then((function() {
    return React.renderToString(component);
  })).then((function(render) {
    return result.component = render;
  })).then((function() {
    return result;
  }));
}
function traceAllCss(modulePaths) {
  var cssTrace = [];
  return Promise.all(modulePaths.map(traceCss)).then((function(traces) {
    return traces.reduce((function(a, b) {
      return a.concat(b);
    }), []);
  })).then((function(traces) {
    return traces.filter((function(a, i) {
      return traces.indexOf(a) === i;
    }));
  }));
}
function traceCss(modulePath) {
  return builder.trace(modulePath).then((function(trace) {
    return Object.keys(builder.loader.loads).map((function(key) {
      return builder.loader.loads[key].address;
    })).filter((function(address) {
      return !!address.match('\\.css$');
    })).map((function(address) {
      return address.substr('file:'.length);
    }));
  }));
}
function renderRoutes(routes, context) {
  routes.reverse();
  var loadedModules = [];
  return Promise.all(routes.map((function(route) {
    return route.component;
  })).map((function(module, i) {
    return Promise.resolve().then((function() {
      if (module)
        return jspm.import(module);
      return require('../defaults/id-component');
    })).then((function(componentModule) {
      return loadedModules[i] = componentModule.default;
    }));
  }))).then((function() {
    return loadedModules.reduce((function(component, next, i) {
      return React.createElement(next, context, component);
    }), null);
  })).then((function(component) {
    var modules = routes.map((function(route) {
      return route.component;
    })).filter((function(module) {
      return !!module;
    }));
    routes.reverse();
    return _renderComponent(component, modules);
  })).then((function(renderObject) {
    context.currentRequest = context.loadingRequest;
    renderObject.context = context;
    renderObject.routes = routes;
    return renderObject;
  }));
}
function renderPage(renderObject, zygo) {
  return runSerialize(renderObject.routes, renderObject.context).then((function() {
    var includeBundles = zygo.config.bundlesJSON && zygo.config.env === 'production';
    var templateData = {
      cssTrace: normalizeCssTrace(renderObject.cssTrace, zygo),
      bundles: includeBundles ? JSON.stringify(zygo.config.bundlesJSON) : null,
      component: renderObject.component,
      routes: JSON.stringify(zygo.config.routes),
      context: JSON.stringify(renderObject.context || {}),
      path: renderObject.context.loadingRequest.path,
      meta: renderObject.context.meta,
      baseURL: 'http://' + renderObject.context.loadingRequest.headers.host,
      addLinkHandlers: zygo.config.anchors
    };
    var template = Handlebars.compile(zygo.config.template);
    return template(templateData);
  }));
}
function runSerialize(routes, context) {
  var handlers = [];
  return Promise.all(routes.map(getHandler)).then((function() {
    handlers.map((function(handler, i) {
      if (handler && handler.serialize)
        handler.serialize(context);
    }));
  }));
  function getHandler(route, i) {
    Routes.getHandler(route).then((function(handler) {
      return handlers[i] = handler ? handler : null;
    }));
  }
}
function normalizeCssTrace(cssTrace, zygo) {
  return cssTrace.map((function(trace) {
    return trace.substr(zygo.baseURL.length);
  }));
}
//# sourceURL=render.js