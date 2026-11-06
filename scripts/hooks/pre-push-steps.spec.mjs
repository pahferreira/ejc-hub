import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { stepsFor } from './pre-push-steps.mjs'

const lintStep = { name: 'lint', command: 'npm', args: ['run', 'lint'] }

describe('stepsFor', () => {
  it('returns the steps of the common entry when only common is changed', () => {
    const table = { common: [lintStep], api: [], app: [] }

    assert.deepEqual(stepsFor(['common'], table), [lintStep])
  })

  it('returns no steps for packages whose table entries are empty', () => {
    const table = { common: [], api: [], app: [] }

    assert.deepEqual(stepsFor(['common', 'api', 'app'], table), [])
  })

  it('returns steps only for the changed packages, in table order', () => {
    const apiStep = { name: 'test', command: 'npm', args: ['test'] }
    const table = { common: [lintStep], api: [apiStep], app: [] }

    assert.deepEqual(stepsFor(['api'], table), [apiStep])
    assert.deepEqual(stepsFor(['api', 'common'], table), [lintStep, apiStep])
  })

  it('returns no steps when no package changed', () => {
    const table = { common: [lintStep], api: [], app: [] }

    assert.deepEqual(stepsFor([], table), [])
  })
})
