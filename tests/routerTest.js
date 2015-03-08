let _ = require('lodash')
let {assert} = require('referee')
let {suite, test, beforeEach, afterEach} = window
let cherrytree = require('..')

suite('Cherrytree')

let router

let routes = function () {
  this.route('application', function () {
    this.route('home', {path: ''})
    this.route('notifications')
    this.route('messages')
    this.route('status', {path: ':user/status/:id'})
  })
}

beforeEach(() => {
  router = cherrytree()
})

afterEach(() => {
  router.destroy()
})

// @api public

test('#use registers middleware', () => {
  assert.expect(2)
  let m = function () {}
  router.use(m)
  assert(router.middleware.length === 1)
  assert(router.middleware[0] === m)
})

test('#map registers the routes', () => {
  assert.expect(3)
  router.map(routes)
  // check that the internal matchers object is created
  assert.equals(_.pluck(router.matchers, 'path'), [
    '/application',
    '/application/notifications',
    '/application/messages',
    '/application/:user/status/:id'
  ])
  // check that the internal routes object is created
  assert.equals(router.routes[0].name, 'application')
  assert.equals(router.routes[0].routes[3].options.path, ':user/status/:id')
})

test('#generate generates urls given route name and params as object', () => {
  assert.expect(1)
  router.map(routes).listen()
  var url = router.generate('status', {user: 'foo', id: 1, queryParams: {withReplies: true}})
  assert.equals(url, '#application/foo/status/1?withReplies=true')
})

test('#generate generates urls given route name and params as args', () => {
  assert.expect(1)
  router.map(routes).listen()
  var url = router.generate('status', 'foo', 1, {queryParams: {withReplies: true}})
  assert.equals(url, '#application/foo/status/1?withReplies=true')
})

test('#generate throws a useful error when listen has not been called', () => {
  assert.expect(1)
  router.map(routes)
  try {
    router.generate('messages')
  } catch (err) {
    assert.equals(err.message, 'Invariant Violation: call .listen() before using .generate()')
  }
})

// @api private

test('#match matches a path against the routes', () => {
  assert.expect(2)
  router.map(routes)
  let match = router.match('/application/KidkArolis/status/42')
  assert.equals(match.params, {
    user: 'KidkArolis',
    id: '42',
    queryParams: {}
  })
  assert.equals(_.pluck(match.routes, 'name'), ['application', 'status'])
})

test('#match matches a path with query params', () => {
  assert.expect(1)
  router.map(routes)
  let match = router.match('/application/KidkArolis/status/42?withReplies=true&foo=bar')
  assert.equals(match.params, {
    user: 'KidkArolis',
    id: '42',
    queryParams: {
      withReplies: 'true',
      foo: 'bar'
    }
  })
})

suite('route maps')

test('routes with name "index" or that end int ".index" default to an empty path', () => {
  router.map(function () {
    this.route('index')
    this.route('foo')
    this.route('bar', function () {
      this.route('bar.index')
    })
  })
  assert.equals(_.pluck(router.matchers, 'path'), [
    '/',
    '/foo',
    '/bar'
  ])
})

test('routes with duplicate names throw a useful error')

test('the path of the first top level route defaults to /')