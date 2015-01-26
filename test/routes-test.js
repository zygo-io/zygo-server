require('traceur-runtime');

var Routes = require('../build/routes');
var assert = require('chai').assert;
var Zygo = require('../build/zygo-server').default;

//For testing runHandlers
var appRoutes = [
  { path: '' },
  { path: '/one', handler: 'app/one' }
];

//For testing match()
var fakeRoutes = {
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
  this.timeout(50000);

  before(function(done) {
    new Zygo('test/fake-app/zygo.json').initialize()
      .then(done).catch(console.log.bind(console));
  });

  it("runs handlers correctly", function(done) {
    Routes.runHandlers(appRoutes)
      .then(function(result) {
        assert(!!result && result.thing);
        assert.equal(result.thing, 'forty two');
        done();
      }).catch(console.log.bind(console));
  });

  it("matches static route correctly", function() {
    var result = Routes.match('/user/about', fakeRoutes);
    assert(!!result); //result should be non null
  });

  it("matches dynamic option routes", function() {
    var result = Routes.match('/post/45', fakeRoutes);
    assert(!!result); //result should be non null
    assert.deepEqual(result.options, {id: '45'});
  });

  it("matches nested dynamic option routes", function() {
    var result = Routes.match('/test/1/2', fakeRoutes);
    assert(!!result); //result should be non null
    assert.deepEqual(result.options, {ida: '1', idb: '2'});
  });
});
