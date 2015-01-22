import React from 'react';
import jspm from 'jspm';
import fs from 'fs';
import Handlebars from 'handlebars';

export function renderRoute(route, zygo) {
  let result = {
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null,
    zygoMeta: route.meta
  };

  return Promise.resolve()
    .then(() => getBody())
    .then((body) => result.zygoBody = body)

    .then(() => getHeader())
    .then((header) => result.zygoHeader = header)

    .then(() => getFooter())
    .then((footer) => result.zygoFooter = footer)

    .then(() => result);

  function getHeader() {
    let template = Handlebars.compile(zygo.config.zygoHeader);
    return Promise.resolve()
       .then(() => zygo._cssTrace(route.component))
       .then((stylesheets) => template({stylesheets}));
  }

  function getBody() {
    let template = Handlebars.compile(zygo.config.zygoBody);
    return Promise.resolve()
      .then(() => jspm.import(route.component))
      .then((componentModule) => {
        let element = React.createElement(componentModule.default, route.state);
        let html = React.renderToString(element);

        return template({html});
      });
  }

  //We have to set System.baseURL by taking the current location and subtracting the route path,
  // else for situations like localhost/my/route/path it will assume that the baseURL is localhost/my/route.
  // Obviously this is wrong if the public files are hosted at localhost etcetera.
  function getFooter() {
    let template = Handlebars.compile(zygo.config.zygoFooter);
    return Promise.resolve()
      .then(() => {
        //set data needed by client for refresh()
        //while state is a property of a route on the server, in the client it is global,
        // hence the need for this copy across
        route.state.route = {
          component: route.component,
          meta: route.meta,

          path: route.path,
          handlers: route.handlers,
          options: route.match,
          headers: route.headers,
          method: route.requestMethod
        };

        //Get routes for the client
        let clientRoutes = {};
        for (let key in zygo.config.routes) clientRoutes[key] = zygo.config.routes[key];
        for (let key in zygo.config.clientRoutes) clientRoutes[key] = zygo.config.clientRoutes[key];

        let templateObject = {
          path: route.path,
          state: JSON.stringify(route.state),
          routes: JSON.stringify(clientRoutes),
          addLinkHandlers: zygo.config.anchors
        };

        //Add bundles into template if we are on prod.
        if (zygo.config.environment === 'production') {
          if (zygo.config.bundlesJSON) {
            templateObject.bundles = fs.readFileSync(zygo.config.bundlesJSON, 'utf-8');

            //We initialise system on the client with the current route bundles
            templateObject.bundleObjects = [];
            let bundleJSON = JSON.parse(templateObject.bundles);
            Object.keys(bundleJSON).map((key) => {
              if (bundleJSON[key].routes.indexOf(route.path) !== -1)
                templateObject.bundleObjects.push({ bundle: key, modules: bundleJSON[key].modules });
            });
          }
        }

        return template(templateObject);
      });
  }
}
