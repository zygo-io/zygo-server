import React from 'react';
import jspm from 'jspm';
import fs from 'graceful-fs';

//TODO: a little hacky, perhaps move string shtuff into handlebars
//             templates? Or something else, at least.

export function renderComponent(component, zygo) {
  let result = {
    zygoBody: null,
    zygoHeader: null,
    zygoFooter: null,
    zygoTitle: zygo.state.route.title
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
    let result = '<script src="jspm_packages/system.js"></script>\n' +
                        '<script src="config.js"></script>\n';

    return Promise.resolve()
      .then(() => zygo._cssTrace(component))
      .then((trace) => {
        trace.map((css) => {
          result += '<link rel="stylesheet" type="text/css" href="' + css + '"></link>\n';
        });
      })
      .then(() => result);
  }

  function getBody() {
    return Promise.resolve()
      .then(() => jspm.import(component))
      .then((componentModule) => {
        let element = React.createElement(componentModule.default, zygo.state);
        let html = React.renderToString(element);

        return '<div id="__zygo-body-container__">\n' + html + '\n</div>';
      });
  }

  function getFooter() {
    let result = '<script>\n' +
                        ' System.import("zygo").then(function(zygo) {\n' +
                        '   zygo._setInitialState(';

    return Promise.resolve()
      .then(() => {
        zygo.emit('serialize');
        result += JSON.stringify(zygo.state);
        zygo.emit('deserialize');

        result += ');\n' +
                          '   zygo._setRoutes(';
      })
      .then(() => {
        let routes = {};
        for (let key in zygo.config.routes) routes[key] = zygo.config.routes[key];
        for (let key in zygo.config.clientRoutes) routes[key] = zygo.config.clientRoutes[key];

        result += JSON.stringify(routes);
        result += ');\n' +
                          '   zygo._addLinkHandlers();\n' +
                          ' });\n' +
                          '</script>';
        return result;
      });
  }
}
