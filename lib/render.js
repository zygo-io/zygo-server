import React from 'react';
import jspm from 'jspm';
import builder from 'systemjs-builder';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import * as Routes from './routes';

//Wrapper around importing a component before rendering.
export function renderComponent(path, state) {
  return jspm.import(path)
    .then((componentModule) => {
      let element = React.createElement(componentModule.default, state);
      return _renderComponent(element, [path]);
    });
}

//Renders the given react component to page elements, with given state.
//Embeds css traces of the given list of component module paths.
function _renderComponent(component, modulePaths=[]) {
  let result = {
    cssTrace: null,
    component: null
  };

  return traceAllCss(modulePaths)
    .then((cssTrace) => result.cssTrace = cssTrace)
    .then(() => React.renderToString(component))
    .then((render) => result.component = render)
    .then(() => result);
}

//Get a list of combined traces from a list of modules
function traceAllCss(modulePaths) {
  let cssTrace = [];
  return Promise.all(modulePaths.map(traceCss))
    .then((traces) => traces.reduce((a, b) => a.concat(b), []))
    .then((traces) => traces.filter((a, i) => traces.indexOf(a) === i));
}

//Traces the css of a module asynchronously, returns a list
// of file paths to the css files a module requires/imports.
function traceCss(modulePath) {
  return builder.trace(modulePath)
  .then((trace) => {
    return Object.keys(builder.loader.loads)
      .map((key) => builder.loader.loads[key].address)
      .filter((address) => !!address.match('\\.css$'))
      .map((address) => address.substr('file:'.length));
  });
}

//Given an ordered list of matched routes, most general to least general,
// return component render nesting them and render it to page elements.
//The given context is that modfied and returned by the component handlers.
export function renderRoutes(routes, context) {
  //We render backwards - we need to inject the least general into its parent etc
  // all the way up the chain.
  routes.reverse();

  //Get component modules
  let loadedModules = [];

  //Load in component modules in order, grabbing identity if component not specified.
  return Promise.all(
    routes
      .map((route) => route.component)
      .map((module, i) => {
        return Promise.resolve()
          .then(() => {
            if (module) return jspm.import(module);
            return require('../defaults/id-component');
          })
          .then((componentModule) =>
            loadedModules[i] = componentModule.default
          );
      })
  )
  .then(() => {
    //Reduce routes down to a single component, return render.
    return loadedModules.reduce((component, next, i) => {
      return React.createElement(next, context, component);
    }, null);
  })
  .then((component) => {
    //grab modules for css trace
    let modules = routes
      .map((route) => route.component)
      .filter((module) => !!module);

    //undo reverse, as it is mutable
    routes.reverse();

    return _renderComponent(component, modules);
  })
  .then((renderObject) => {
    //Swap current and loading request.
    context.currentRequest = context.loadingRequest;
    delete context.loadingRequest;

    renderObject.context = context;
    renderObject.routes = routes;
    return renderObject;
  });
}

//Given renderObject from the other functions, renders the template specified in config.
// Returns HTML.
//Requires a zygo instance as we need to inject various config things, such as
// the routes object, the bundles JSON, etcetera.
export function renderPage(renderObject, zygo) {
  //we need to pass in:
  // bundling information
  // css trace information - _normalized_
  return runSerialize(renderObject.routes, renderObject.context)
    .then(() => {
      var includeBundles = zygo.config.bundlesJSON && zygo.config.env === 'production';

      let templateData = {
        cssTrace: normalizeCssTrace(renderObject.cssTrace, zygo),
        bundles: includeBundles ? JSON.stringify(zygo.config.bundlesJSON) : null,
        visibleBundles: includeBundles ? getVisibleBundles(renderObject.routes, zygo) : null,
        component: renderObject.component,
        routes: JSON.stringify(zygo.routes),
        context: JSON.stringify(renderObject.context || {}),
        path: renderObject.context.currentRequest.path,
        meta: renderObject.context.meta,
        baseURL: 'http://' + renderObject.context.currentRequest.headers.host,
        addLinkHandlers: zygo.config.anchors
      };

      let template = Handlebars.compile(zygo.config.template);
      return template(templateData);
    });
}

//Given the routes and the context, serialize if necessary
function runSerialize(routes, context) {
  let handlers = [];
  return Promise.all(routes.map(getHandler))
    .then(() => {
      handlers.map((handler, i) => {
        if (handler && handler.serialize) handler.serialize(context);
      });
    });

  function getHandler(route, i) {
    Routes.getHandler(route)
      .then((handler) => handlers[i] = handler ? handler : null);
  }
}

//Find bundles visible to the given routes. We inject these as script tags
// for a performant first load.
//Set bundles visible to given routes
export function getVisibleBundles(routes, zygo) {
  if (!zygo.config.bundlesJSON) return;

  let bundles = [];
  Object.keys(zygo.config.bundlesJSON).map((key) => {
    let sharedRoutes =
      routes.filter((route) => zygo.config.bundlesJSON[key].routes.indexOf(route._path) !== -1);

    if (sharedRoutes.length > 0)
      bundles.push('/' + key);
  });

  return bundles;
}

//Normalize a css trace relative to Zygo's base URL, so the client can find it.
function normalizeCssTrace(cssTrace, zygo) {
  return cssTrace.map((trace) => trace.substr(zygo.baseURL.length));
}
