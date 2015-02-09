import mime from 'mime';
import http from 'http';
import path from 'path';
import fs from 'fs';
import jspm from 'jspm';

//A lightweight server wrapper around a zygo instance.
//Zygo first attempts to static serve an asset.
//If this fails, it passes to the router, which handles 404s.
export function createServer(zygo) {
  let server = http.createServer();
  server._zygo = zygo;
  server._zygowares = [serveStatic.bind(server), serveRoutes.bind(server)];
  // server._middlewares = loadMiddleware(zygo.config.middleware);
  return loadMiddleware(zygo.config.middleware)
    .then((middlewares) => {
      server._middlewares = middlewares;
      server.use = addMiddleware.bind(server);
      server.on('request', (req, res) => handleRequest.call(server, req, res, zygo));

      return server;
    });
}

function serveStatic(req, res, next) {
  let staticPath = path.join(this._zygo.baseURL, req.url);

  fs.readFile(staticPath, (error, data) => {
    if (error) return next();

    res.writeHead(200, { 'Content-Type': mime.lookup(staticPath) });
    res.write(data);
    res.end();
  });
}

//Terminal, never calls next(). Middleware runs before zygo does.
function serveRoutes(req, res, next) {
    this._zygo.route(req.url, req.headers, req.method)
      .then((html) => {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(html);
        res.end();
      })
      .catch((error) => {
        console.log("Error routing " + req.url + " :\n" + error);
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write("404 not found");
        res.end();
      });
}

function handleRequest(req, res, zygo) {
  var handlers = this._middlewares.concat(this._zygowares);
  handlers[0](req, res, next(0), zygo);

  function next(index) {
    return () => {
      if (index < handlers.length - 1) handlers[index+1](req, res, next(index+1), zygo);
    };
  }
}

function addMiddleware(requestHandler) {
  this._middlewares.push(requestHandler);
}

//List of middleware given as modules to be required.
function loadMiddleware(middleware) {
  if (!(middleware instanceof Array)) middleware = [middleware];

  return Promise.all(
    middleware
      .map((modulePath) => {
        return jspm.import(modulePath)
          .then((module) => module.middleware);
      })
  );
}
