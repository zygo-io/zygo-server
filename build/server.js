"use strict";
Object.defineProperties(exports, {
  createServer: {get: function() {
      return createServer;
    }},
  __esModule: {value: true}
});
var $__mime__,
    $__http__,
    $__path__,
    $__fs__,
    $__jspm__,
    $__debug__;
var mime = ($__mime__ = require("mime"), $__mime__ && $__mime__.__esModule && $__mime__ || {default: $__mime__}).default;
var http = ($__http__ = require("http"), $__http__ && $__http__.__esModule && $__http__ || {default: $__http__}).default;
var path = ($__path__ = require("path"), $__path__ && $__path__.__esModule && $__path__ || {default: $__path__}).default;
var fs = ($__fs__ = require("fs"), $__fs__ && $__fs__.__esModule && $__fs__ || {default: $__fs__}).default;
var jspm = ($__jspm__ = require("jspm"), $__jspm__ && $__jspm__.__esModule && $__jspm__ || {default: $__jspm__}).default;
var Debug = ($__debug__ = require("./debug"), $__debug__ && $__debug__.__esModule && $__debug__ || {default: $__debug__});
function createServer(zygo) {
  var server = http.createServer();
  server._zygo = zygo;
  server._zygowares = [serveStatic.bind(server), serveRoutes.bind(server)];
  return loadMiddleware(zygo.config.middleware).then((function(middlewares) {
    server._middlewares = middlewares;
    server.use = addMiddleware.bind(server);
    server.on('request', (function(req, res) {
      return handleRequest.call(server, req, res, zygo);
    }));
    return server;
  })).catch(Debug.propagate("Error creating server: "));
}
function serveStatic(req, res, next) {
  var staticPath = path.join(this._zygo.baseURL, req.url);
  fs.readFile(staticPath, (function(error, data) {
    if (error)
      return next();
    res.writeHead(200, {'Content-Type': mime.lookup(staticPath)});
    res.write(data);
    res.end();
  }));
}
function serveRoutes(req, res, next) {
  this._zygo.route(req.url, req.headers, req.method).then((function(html) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(html);
    res.end();
  })).catch((function(error) {
    console.log("Error routing " + req.url + " :\n" + error);
    res.writeHead(404, {'Content-Type': 'text/plain'});
    res.write("404 not found");
    res.end();
    throw error;
  }));
}
function handleRequest(req, res, zygo) {
  var handlers = this._middlewares.concat(this._zygowares);
  handlers[0](req, res, next(0), zygo);
  function next(index) {
    return (function() {
      if (index < handlers.length - 1)
        handlers[index + 1](req, res, next(index + 1), zygo);
    });
  }
}
function addMiddleware(requestHandler) {
  this._middlewares.push(requestHandler);
}
function loadMiddleware(middleware) {
  if (!(middleware instanceof Array))
    middleware = [middleware];
  return Promise.all(middleware.map((function(modulePath) {
    return jspm.import(modulePath).then((function(module) {
      return module.middleware;
    }));
  }))).catch(Debug.propagate("Error loading server middleware: "));
}
//# sourceURL=server.js