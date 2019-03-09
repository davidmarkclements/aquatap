'use strict'
const tap = require('tap')
const { captureStackTrace } = Error
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

function w (fn) {
  const stackFilter = (...args) => {
    Error.captureStackTrace = (o) => captureStackTrace(o, stackFilter)
    const result = fn(...args)
    Error.captureStackTrace = captureStackTrace
    return result
  }
  return stackFilter
}

function api (fn) {
  if (!(fn instanceof AsyncFunction)) {
    throw Error(`Aquatap API only accepts async functions`)
  }
  return (t) => {
    const is = w((actual, expected, message) => t.is(actual, expected, message))
    const isNot = w((actual, expected, message) => t.isNot(actual, expected, message))
    const same = w((actual, expected, message) => t.strictSame(actual, expected, message))
    const different = w((actual, expected, message) => t.strictNotSame(actual, expected, message))
    const ok = w((value, message) => t.ok(value, message))
    const not = w((value, message) => t.notOk(value, message))
    const pass = w((message) => t.pass(message))
    const fail = w((message) => t.fail(message))

    const throws = w((fn, error, message) => {
      if (fn instanceof AsyncFunction) {
        return fn().then(
          () => t.throws(() => {}, error, message),
          (err) => t.throws(() => { throw err }, error, message)
        )
      }
      return t.throws(fn, error, message)
    })
    const doesNotThrow = w((fn, message) => {
      if (fn instanceof AsyncFunction) {
        return fn().then(
          () => t.doesNotThrow(() => {}, message),
          (err) => t.doesNotThrow(() => { throw err }, message)
        )
      }
      return t.doesNotThrow(fn, message)
    })

    is.loosely = w((actual, expected, message) => t.same(actual, expected, message))
    isNot.loosely = w((actual, expected, message) => t.notSame(actual, expected, message))
    same.loosely = w((actual, expected, message) => t.same(actual, expected, message))
    different.loosely = w((actual, expected, message) => t.notSame(actual, expected, message))

    const { plan, timeout, comment } = t

    return fn({
      is,
      isNot,
      same,
      different,
      throws, 
      doesNotThrow, 
      plan,
      ok,
      not,
      fail,
      pass,
      timeout,
      comment
    })
  }
}

function test (desc, fn) {
  return tap.test(desc, api(fn))
}
function only (desc, fn) {
  return tap.only(desc, api(fn))
}
function skip (desc, fn) {
  return tap.skip(desc, api(fn))
}
test.only = only
test.skip = skip
test.test = test
test.pipe = tap.pipe

module.exports = test