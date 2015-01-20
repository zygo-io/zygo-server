# Zygo-Server

Zygo is the beginnings of a slim dual client/server rendering framework built around [JSPM](https://www.github.com/jspm/jspm-cli) and [React](https://www.github.com/facebook/react). This repo contains the server-side rendering and routing code. It is intended to be run as a server bootstrap for an app using [JSPM](https://www.github.com/jspm/jspm-cli) and [Zygo-Client](https://www.github.com/Bubblyworld/zygo).

For an overview of the problem Zygo solves and some motivation, see [Zygo-Client](https://www.github.com/Bubblyworld/zygo).

## Installation
To install it as an npm dependency, run:
``` bash
$ npm install --save zygo-server
```

## Example Usage
For a more detailed description of the server API, see the [project wiki](https://www.github.com/Bubblyworld/zygo-server/wiki).  
For a complete example, see [Zygo-Example](https://www.github.com/Bubblyworld/zygo-example).

``` javascript
import Zygo from 'zygo-server';

let zygo = new Zygo('zygo.json');
zygo.initialise()
  .then(() => zygo.createServer())
  .catch(console.error.bind(console));
```
