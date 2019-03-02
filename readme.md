# aquatap

fullstack TAP with a modern API

## Principles

* fullstack support with consistent behavior and output
* no synonyms, only one way to do anything
* no test runner required, pure node/browser
* async/await for flow control
* no configuration files
* control behavior with env vars, never with options objects

## API

### `test(description, async function)` (default)

Create a test, the async function will be passed an object,
which provides the assertions and utilities interface.

```js
const { test } = require('aquatap')
test('some test', async ({ is }) => {
  is(true, true)
})
```

For convenience the `test` method is both the main 
export and named exported method 

```js
const test = require('aquatap')
console.log(test === test.test) // true
```

### `only(description, async function)`

Filter out other tests by using the `only` method:

```js
const { test, only } = require('aquatap')
test('some test', async ({ is }) => {
  is(true, true)
})
only('another test', async ({ is }) => {
  is(true, false)
})
```

When run normally, this will run both tests, 
when when run with the `TAP_ONLY` environment
variable only the second test will run:

```sh
TAP_ONLY=1 node test.js # will only run the second test
```

The `only` method is also available on the `test` method:

```js
const { test } = require('aquatap') 
test.only('another test', async ({ is }) => {
  is(true, false)
})
```

### `skip(description, async function)`

Skip a test: 

```js
const { test, skip } = require('aquatap')
skip('some test', async ({ is }) => {
  is(true, true)
})
test('another test', async ({ is }) => {
  is(true, false)
})
```

The first test will not be executed.

The `skip` method is also available on the `test` method:

```js
const { test } = require('aquatap') 
test.skip('some test', async ({ is }) => {
  is(true, true)
})
```

### `pipe(stream)`

By default TAP output is streamed to `process.stdout`. 
Use the `pipe` method to redirect it to any writable stream.

### Assertions

#### `is(actual, expected, [ message ])`

Compare `actual` to `expected` with `===`

#### `isNot(actual, expected, [ message ])`

Compare `actual` to `expected` with `!==`

#### `same(actual, expected, [ message ])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `===`.

#### `different(actual, expected, [ message ])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `!==`.

#### `throws(function|async function, [ error, message ])`

Verify that a function throws.

```js
throws(() => { throw Error('an err') }, Error('an err'))
```

If the function is an async function, `throws` must be awaited:

```js
await throws(async () => { throw Error('an err')}, Error('an err'))
```

Where the `error` parameter is supplied as an error instance or
as a string representing the error message, the thrown (or rejected) 
error will be checked against it.

#### `doesNotThrow(function|async function, [ message ])`

Verify that a function or async function does not throw.

If the function is an async function, `doestNotThrow` must be awaited:

```js
await doesNotThrow(async () => { })
```

#### `ok(value, [ message ])`

Checks that `value` is truthy: `!!value === true`

#### `not(value, [ message ])`

Checks that `value` is falsy: `!!value === false`

#### `pass([ message ])`

Asserts success. Useful for explicitly confirming
that a function was called, or that behavior is 
as expected.

#### `fail([ message ])`

Asserts failure. Useful for explicitly checking
that a function should not be called.

#### `is.loosely(actual, expected, [ message ])`

Compare `actual` to `expected` with `==`

#### `isNot.loosely(actual, expected, [ message ])`

Compare `actual` to `expected` with `!=`

#### `same.loosely(actual, expected, [ message ])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `==`.

#### `different.loosely(actual, expected, [ message ])`

Object comparison, comparing all primitives on the 
`actual` object to those on the `expected` object
using `!=`.

### Utilities

#### `plan(n)`

Constrain a test to an explicit amount of assertions.

#### `timeout(ms)`

Fail the test after a given timeout.  

#### `comment(message)`

Inject a TAP comment into the output.

## Running Tests

### Node

Aquatap is a test library, rather than a test runner. For running Node tests,
there are no globally injected variables or anything special required so tests
can be run directly with node like so:

```sh
node my-tests.js
```

This will output TAP to stdout. A test runner can be used to make tests prettier
and generate coverage information. As a convenience aquatap exposes the `tap` 
executable of [tap](https://npm.im/tap) for various TAP processing and reporting:

```sh
tap my-tests.js
```

#### Coverage

The `tap` executable can be used to analyze coverage like so:

```sh
tap --coverage my-tests.js
```

Use `tap --help` to discover more options.

### Browser

Aquatap has been built to work with [airtap](https://npm.im/airtap).

Local test running will work out of the box:

```sh
airtap --local my-tests.js
```

See the [airtap docs](https://github.com/airtap/airtap/tree/master/doc) for
configuring with Sauce Labs, running in Electron and more.


## Configuration

Configuration is achieved via environment variables.

### `TAP_ONLY`

Restrict tests to those using the `only` method instead of the `test`
method.



## Strategies

### Testing callback-based API's

Tests must only be specified using `async` functions, any callback API's
have to be shoehorned into the async/await paradigm. 

For common callback scenarios the `promisify` method on the core `util` module 
can be used to achieve this:

```js
const test = require('aquatap')
const { promisify } = require('util')
const dns = require('dns')
test('a callback-based API', async ({ same }) => {
  const lookup = promisify(dns.lookup)
  same(await lookup('google.com'), { address: '172.217.19.238', family: 4 })
})
```

An added advantage of this approach is that any errors will lead 
to promise rejection, which will lead to a throw in the `async` function,
which is then automatically handled as a TAP assertion failure in the output.

### Testing events

While event emitters do use callbacks, the callbacks are generally designed
to be called multiple times. This is also true of API's with listener functions,
such as the `createServer` method of `http`. Typically listener function parameters
are passed onto event emitters.

To test an event use the `events.once` method:

```js
const test = require('aquatap')
const { once } = require('events')
const { createServer, get } = require('http')
const test = require('.')
test('an event-based API', async ({ is }) => {
  const server = createServer((req, res) => res.end('test')).unref().listen()
  await once(server, 'listening')
  const { port } = server.address()
  const [ res ] = await once(get(`http://localhost:${port}`), 'response')
  const [ result ] = await once(res, 'data')
  is(result.toString(), 'test')
})
```

## Prior Art

Aquatap is based on both [tape](https://npm.im/tape) and [tap](https://npm.im/tap), 
and wraps both of them to create a consistent API across browser and Node.

## License

MIT