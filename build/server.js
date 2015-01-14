"use strict";
Object.defineProperties(exports, {
  default: {get: function() {
      return $__default;
    }},
  __esModule: {value: true}
});
var $__zygo_45_server__,
    $__express__;
var Zygo = ($__zygo_45_server__ = require("./zygo-server"), $__zygo_45_server__ && $__zygo_45_server__.__esModule && $__zygo_45_server__ || {default: $__zygo_45_server__}).default;
var express = ($__express__ = require("express"), $__express__ && $__express__.__esModule && $__express__ || {default: $__express__}).default;
function createServer(zygo) {
  var app = express();
  app.use('/', express.static(zygo.config.packageDir));
  app.use('/', (function(request, response) {
    try {
      zygo.route(request.url, request.headers, request.method).then((function(html) {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(html);
        response.end();
      }));
    } catch (error) {
      response.writeHead(500);
      response.write('Internal server error.');
      response.end();
      console.error();
      console.error("Error in server: ");
      console.error(error);
    }
  }));
  return app;
}
var $__default = createServer;
//# sourceURL=server.js