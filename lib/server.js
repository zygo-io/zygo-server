import Zygo from './zygo-server';
import express from 'express';

//Does what it says on the box. Note you still have to call listen.
export default function createServer(zygo) {
  let app = express();

  app.use('/', express.static(zygo.baseURL));
  app.use('/', (request, response) => {
      zygo.route(request.url, request.headers, request.method).then((html) =>{
          //Send through html, success!
          response.writeHead(200, {'Content-Type': 'text/html'});
          response.write(html);
          response.end();
      }).catch((error) => {
        response.writeHead(500);
        response.write('Internal server error.');
        response.end();

        console.error();
        console.error("Error in server: ");
        console.error(error.stack);
      });
  });

  return app;
}
