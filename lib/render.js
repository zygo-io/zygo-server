import React from 'react';
import jspm from 'jspm';
import fs from 'fs';

//TODO: a little hacky, perhaps move string shtuff into handlebars
//             templates? Or something else, at least.

export function renderRoute(route, zygo) {
  let result = {
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null,
    zygoTitle: route.title
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
    let result = '<script src="/jspm_packages/system.js"></script>\n' +
                        '<script src="/config.js"></script>\n';

    return Promise.resolve()
      .then(() => zygo._cssTrace(route.component))
      .then((trace) => {
        trace.map((css) => {
          result += '<link rel="stylesheet" type="text/css" href="' + css + '"></link>\n';
        });
      })
      .then(() => result);
  }

  function getBody() {
    return Promise.resolve()
      .then(() => jspm.import(route.component))
      .then((componentModule) => {
        let element = React.createElement(componentModule.default, route.state);
        let html = React.renderToString(element);

        return '<div id="__zygo-body-container__">\n' + html + '\n</div>';
      });
  }

  function getFooter() {
    let result = '<script>\n' +
                        ' System.baseURL = location.href.substr(0, location.href.length - ' + route.path.length + ');\n' +
                        ' System.import("zygo").then(function(zygo) {\n' +
                        '   zygo._setInitialState(';

    return Promise.resolve()
      .then(() => {
        //set data needed by client for refresh()
        //while state is a property of a route on the server, in the client it is global,
        // hence the need for this copy across
        route.state.route = {
          component: route.component,
          title: route.title,

          path: route.path,
          handlers: route.handlers,
          options: route.match,
          headers: route.headers,
          method: route.requestMethod
        };

        zygo.emit('serialize', route.state);
        result += JSON.stringify(route.state);
        zygo.emit('deserialize', route.state);

        result += ');\n' +
                          '   zygo._setRoutes(';
      })
      .then(() => {
        let routes = {};
        for (let key in zygo.config.routes) routes[key] = zygo.config.routes[key];
        for (let key in zygo.config.clientRoutes) routes[key] = zygo.config.clientRoutes[key];

        result += JSON.stringify(routes);
        result += ');\n' +
                          (zygo.config.anchors ? '   zygo._addLinkHandlers();\n' : '') +
                          '   zygo._emit("deserialize", zygo.state);\n' +
                          '   zygo.refresh();\n' +
                          ' });\n' +
                          '</script>';
        return result;
      });
  }
}
