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
  getVisibleBundles: {get: function() {
      return getVisibleBundles;
    }},
  __esModule: {value: true}
});
var $__react__,
    $__jspm__,
    $__systemjs_45_builder__,
    $__fs__,
    $__path__,
    $__handlebars__,
    $__routes__,
    $__debug__;
var React = ($__react__ = require("react"), $__react__ && $__react__.__esModule && $__react__ || {default: $__react__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var builder = ($__systemjs_45_builder__ = require("systemjs-builder"), $__systemjs_45_builder__ && $__systemjs_45_builder__.__esModule && $__systemjs_45_builder__ || {default: $__systemjs_45_builder__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var Handlebars = ($__handlebars__ = require("handlebars"), $__handlebars__ && $__handlebars__.__esModule && $__handlebars__ || {default: $__handlebars__}).default;
var Routes = ($__routes__ = require("./routes"), $__routes__ && $__routes__.__esModule && $__routes__ || {default: $__routes__});
var Debug = ($__debug__ = require("./debug"), $__debug__ && $__debug__.__esModule && $__debug__ || {default: $__debug__});
function renderComponent(path, state) {
  return jspm.import(path).then((function(componentModule) {
    var element = React.createElement(componentModule.default, state);
    return _renderComponent(element, [path]);
  })).catch(Debug.propagate("Error rendering component: "));
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
  })).then((function(rendered) {
    return result.component = rendered;
  })).then((function() {
    return result;
  })).catch(Debug.propagate("Error in _renderComponent(): "));
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
  })).catch(Debug.propagate("Error tracing css: "));
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
    renderObject.context = context;
    renderObject.routes = routes;
    return renderObject;
  })).catch(Debug.propagate("Error rendering routes: "));
}
function renderPage(renderObject, zygo) {
  return runSerialize(renderObject.routes, renderObject.context).then((function() {
    var includeBundles = zygo.config.bundlesJSON && zygo.config.env === 'production';
    var templateData = {
      cssTrace: normalizeCssTrace(renderObject.cssTrace, zygo),
      bundles: includeBundles ? JSON.stringify(zygo.config.bundlesJSON) : null,
      visibleBundles: includeBundles ? getVisibleBundles(renderObject.routes, zygo) : null,
      component: renderObject.component,
      routes: JSON.stringify(zygo.routes),
      context: JSON.stringify(renderObject.context || {}),
      path: renderObject.context.curRoute.path,
      meta: renderObject.context.templateMeta,
      baseURL: 'http://' + renderObject.context.curRoute.headers.host,
      addLinkHandlers: zygo.config.anchors
    };
    var template = Handlebars.compile(zygo.config.template);
    return template(templateData);
  })).catch(Debug.propagate("Error rendering page: "));
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
    })).catch(Debug.propagate("Error getting handler in runSerialize(): "));
  }
}
function getVisibleBundles(routes, zygo) {
  if (!zygo.config.bundlesJSON)
    return;
  var bundles = [];
  Object.keys(zygo.config.bundlesJSON).map((function(key) {
    var sharedRoutes = routes.filter((function(route) {
      return zygo.config.bundlesJSON[key].routes.indexOf(route._path) !== -1;
    }));
    if (sharedRoutes.length > 0)
      bundles.push('/' + key);
  }));
  return bundles;
}
function normalizeCssTrace(cssTrace, zygo) {
  return cssTrace.map((function(trace) {
    return trace.substr(zygo.baseURL.length);
  }));
}
//# sourceURL=render.js