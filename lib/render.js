import React from 'react';
import jspm from 'jspm';
import builder from 'systemjs-builder';
import fs from 'fs';
import Handlebars from 'handlebars';

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
//The given state is the similarly ordered state returned by each routes handler.
export function renderRoutes(routes, states) {
  //We render backwards - we need to inject the least general into its parent etc
  // all the way up the chain.
  routes.reverse();
  states.reverse();

  //Get list of modules for loading and cssTrace purposes.
  let modules = routes.map((route) => route.component);
  let loadedModules = [];

  //Load in component modules in order
  return Promise.all(modules.map((module, i) =>
    jspm.import(module).then((componentModule) =>
      loadedModules[i] = componentModule.default
    )
  ))
  .then(() => {
    //Reduce routes down to a single component, return render.
    return loadedModules.reduce((component, next, i) => {
      return React.createElement(next, states[i], component);
    }, null);
  })
  .then((component) => _renderComponent(component, modules))
  .then((renderObject) => {
    renderObject.states = states;
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
  return runSerialize(renderObject.routes, renderObject.state)
    .then(() => {
      let templateData = {
        cssTrace: normalizeCssTrace(renderObject.cssTrace, zygo),
        bundles: zygo.config.bundlesJSON ? zygo.config.bundlesJSON : null,
        visibleBundles : zygo.config.bundlesJSON ? bundlesVisibleTo(zygo.config.bundlesJSON, renderObject.routes) : null,
        component: renderObject.component,
        routes: zygo.routes,
        states: renderObject.states
      };

      console.log(zygo.config.template);
      let template = Handlebars.compile(zygo.config.template);
      return template(templateData);
    });
}

//Given the routes and the states, serialise the routes if necessary
function runSerialize(routes, states) {
  let handlers = [];
  return Promise.all(routes.map(getHandler))
    .then(() => {
      handlers.map((handler, i) => {
        if (handler && handler.serialize) handler.serialize(states[i]);
        //TODO NOT COMPLETE
      });
    });

  function getHandler(route, i) {
    if (route.handler)
      return jspm.import(route.handler)
        .then((handler) => handlers[i] = handler);
    return handlers[i] = null;
  }
}

//Given the bundle objects and routes, which bundles are visible
// by the current routes so we can inject his up front?
function bundlesVisibleTo(bundles, routes) {
  let result = [];

  Object.keys(bundles).map((key) => {
    let sharedRoutes =
      routes.filter((route) => bundles[key].routes.indexOf(route) !== -1);

    if (sharedRoutes.length === routes.length) result.push({
      path: key,
      modules: bundles[key]
    });
  });

  return result;
}

function normalizeCssTrace(cssTrace, zygo) {
  return cssTrace.map((trace) => trace.substr(zygo.baseURL.length));
}
