require('traceur-runtime');

var Routes = require('../build/routes');
var assert = require('chai').assert;

var routes = {
  component: 'fake',
  handler: 'fake',

  '/post/:id': {
    component: 'fake',
    handler: 'fake'
  },

  '/test' : {
    '/:ida': {
      '/:idb' : {}
    }
  },

  '/user': {
    component: 'fake',
    handler: 'fake',

    '/about': {
      component: 'fake',
      handler: 'fake'
    }
  }
};

describe("routes.js tests", function() {
  it("matches static route correctly", function() {
    var result = Routes.match('/user/about', routes);
    assert(!!result); //result should be non null
  });

  it("only matches the leaf routes, not partial routes", function() {
    var result = Routes.match('/user', routes);
    assert(!result); //result should be null
  });

  it("matches dynamic option routes", function() {
    var result = Routes.match('/post/45', routes);
    assert(!!result); //result should be non null
    assert.deepEqual(result.options, {id: '45'});
  });

  it("matches nested dynamic option routes", function() {
    var result = Routes.match('/test/1/2', routes);
    assert(!!result); //result should be non null
    assert.deepEqual(result.options, {ida: '1', idb: '2'});
  });
});
