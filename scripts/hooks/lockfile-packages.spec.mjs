import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { packagesWithChangedLockfile } from './lockfile-packages.mjs'

describe('packagesWithChangedLockfile', () => {
  it('maps the root lockfile to the root package', () => {
    assert.deepEqual(packagesWithChangedLockfile(['package-lock.json']), ['.'])
  })

  it('maps each package lockfile to its package, in install order', () => {
    assert.deepEqual(
      packagesWithChangedLockfile(['app/package-lock.json', 'api/package-lock.json', 'common/package-lock.json']),
      ['common', 'api', 'app'],
    )
  })

  it('ignores a package.json change with no lockfile change', () => {
    assert.deepEqual(packagesWithChangedLockfile(['api/package.json', 'app/src/main.tsx']), [])
  })

  it('ignores a lockfile nested deeper than a package root', () => {
    assert.deepEqual(packagesWithChangedLockfile(['app/vendor/thing/package-lock.json']), [])
  })
})
