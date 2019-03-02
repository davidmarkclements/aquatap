'use strict'
const tape = require('tape').createHarness()
const through = require('through2')

tape.createStream().pipe(process.browser ? through((line, _, cb) => {
  console.log(line)
  cb()
})  : process.stdout)

const { test } = process.env.B ? require('../browser') : require('..')

const parser = through((line, _, cb) => {
  line = line.toString().trimLeft()
  const assertionResult = /^(not )?ok\b/.test(line)
  if (assertionResult) {
    parser.ok = (line[0] === 'o')
    parser.cur = line.replace(/.+ \d+ (.+)/, '$1').trimLeft().replace(/^-/, '').split('\n')[0].trim()
    parser.line = line
  }
  cb(null, line)
})

test.pipe(parser)

tape('test throws when not passed an async function', ({ throws, end }) => {
  throws(
    () => { test('', () => {}) },
    Error(`Aquatap API only accepts async functions`)
  )
  end()
})

tape('assertions API functions exist', (t) => {
  test('assertions', async ({ 
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
  }) => {
    t.is(typeof is, 'function', 'is')
    t.is(typeof isNot, 'function', 'isNot')
    t.is(typeof same, 'function', 'same')
    t.is(typeof different, 'function', 'different')
    t.is(typeof throws , 'function', 'throws')
    t.is(typeof doesNotThrow , 'function', 'doesNotThrow')
    t.is(typeof plan, 'function', 'plan')
    t.is(typeof ok, 'function', 'ok')
    t.is(typeof not, 'function', 'not')
    t.is(typeof fail, 'function', 'fail')
    t.is(typeof pass, 'function', 'pass')
    t.is(typeof is.loosely, 'function', 'is.loosely')
    t.is(typeof isNot.loosely, 'function', 'isNot.loosely')
    t.is(typeof same.loosely, 'function', 'same.loosely')
    t.is(typeof different.loosely, 'function', 'different.loosely')
    t.is(typeof timeout, 'function', 'timeout')
    t.is(typeof comment, 'function', 'comment')
    t.end()
  })
})

tape('throws', (t) => {
  test('throws', async ({ throws, is }) => {
    const errA = Error('A')
    const errB = Error('B')
    const errC = Error('C')
    const errD = Error('D')
    throws(() => { throw errA }, errA, 'a msg')
    t.is(parser.cur, 'a msg: Error A')
    t.is(parser.ok, true)
    throws(() => { }, errB, 'a msg')
    t.is(parser.cur, 'a msg: Error B')
    t.is(parser.ok, false)
    await throws(async () => { throw errC }, errC, 'a msg')
    t.is(parser.cur, 'a msg: Error C')
    t.is(parser.ok, true)
    await throws(async () => { }, errD, 'a msg')
    t.is(parser.cur, 'a msg: Error D')
    t.is(parser.ok, false)
    t.end()
  })
})

tape('throws', (t) => {
  test('throws', async ({ throws }) => {
    const errA = Error('A')
    const errB = Error('B')
    const errC = Error('C')
    const errD = Error('D')
    throws(() => { throw errA }, errA, 'a msg')
    t.is(parser.cur, 'a msg: Error A')
    t.is(parser.ok, true)
    throws(() => { throw errB }, errA, 'a msg')
    t.is(parser.cur, 'a msg: Error A')
    t.is(parser.ok, false)
    throws(() => { }, errB, 'a msg')
    t.is(parser.cur, 'a msg: Error B')
    t.is(parser.ok, false)
    await throws(async () => { throw errC }, errC, 'a msg')
    t.is(parser.cur, 'a msg: Error C')
    t.is(parser.ok, true)
    await throws(async () => { throw errD }, errC, 'a msg')
    t.is(parser.cur, 'a msg: Error C')
    t.is(parser.ok, false)
    await throws(async () => { }, errD, 'a msg')
    t.is(parser.cur, 'a msg: Error D')
    t.is(parser.ok, false)
    t.end()
  })
})

tape('doesNotThrow', (t) => {
  test('doesNotThrow', async ({ doesNotThrow }) => {
    const err = Error('A')
    doesNotThrow(() => { }, 'a msg')
    t.is(parser.cur, 'a msg')
    t.is(parser.ok, true)
    doesNotThrow(() => { throw err }, 'a msg')
    t.is(parser.cur, 'a msg')
    t.is(parser.ok, false)
    await doesNotThrow(async () => { }, 'a msg')
    t.is(parser.cur, 'a msg')
    t.is(parser.ok, true)
    await doesNotThrow(async () => { throw err }, 'a msg')
    t.is(parser.cur, 'a msg')
    t.is(parser.ok, false)
    t.end()
  })
})