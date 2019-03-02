'use strict'

const tape = require('tape')
const tmatch = require('tmatch')
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor

function api (fn) {
  if (!(fn instanceof AsyncFunction)) {
    throw Error(`Aquatap API only accepts async functions`)
  }
  return (t) => {
    const is = (actual, expected, message) => t.is(actual, expected, message)
    const isNot = (actual, expected, message) => t.isNot(actual, expected, message)
    const same = (actual, expected, message) => t.same(actual, expected, message)
    const different = (actual, expected, message) => t.notSame(actual, expected, message)
    const ok = (value, message) => t.ok(value, message)
    const not = (value, message) => t.notOk(value, message)
    const pass = (message) => t.pass(message)
    const fail = (message) => t.fail(message)

    const matchThrow = (fn, error, message) => {
      if (error instanceof Error) {
        try { 
          fn()
          t.throws(() => {}, error, message)
        } catch (err) {
          const actual = {message: err.message}
          const expected = {message: error.message}
          for (const k in err) actual[k] = err[k]
          for (const k in error) expected[k] = error[k]
          const match = tmatch(actual, expected)
          if (match) t.throws(() => { throw err }, error, message)
          else t.ok(match, message)
        }
        return
      }

      return t.throws(fn, error, message)
    }

    const throws = (fn, error, message) => {
      if (error && error.message) {
        if (message && message.length) {
          message = `${message}: Error ${error.message}`
        }
      }
      if (fn instanceof AsyncFunction) {
        return fn().then(
          () => matchThrow(() => {}, error, message),
          (err) => matchThrow(() => { throw err }, error, message)
        )
      }
      return matchThrow(fn, error, message)
    }
    const doesNotThrow = (fn, message) => {
      if (fn instanceof AsyncFunction) {
        return fn().then(
          () => t.doesNotThrow(() => {}, message),
          (err) => t.doesNotThrow(() => { throw err }, message)
        )
      }
      return t.doesNotThrow(fn, message)
    }

    is.loosely = (actual, expected, message) => t.looseEqual(actual, expected, message)
    isNot.loosely = (actual, expected, message) => t.notLooseEqual(actual, expected, message)
    same.loosely = (actual, expected, message) => t.looseEqual(actual, expected, message)
    different.loosely = (actual, expected, message) => t.notLooseEqual(actual, expected, message)

    const { plan, timeoutAfter: timeout, comment } = t


    var planning = false
    const spy = () => planning = true
    t.once('plan', spy)
    try { 
      const result = fn({
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
      if (planning || !result) return
      if (typeof result.then !== 'function') return
      result.then(t.end, t.end)
    } catch (e) {
      t.end(e)
    } finally {
      t.removeListener('plan', spy)
    }
  }
}


function test (desc, fn) {
  return tape.test(desc, api(fn))
}
function only (desc, fn) {
  return tape.only(desc, api(fn))
}
function skip (desc, fn) {
  return tape.skip(desc, api(fn))
}

test.only = only
test.skip = skip
test.test = test
test.pipe = (...args) => {
  const stream = tape.createStream()
  return stream.pipe(...args)
}

module.exports = test