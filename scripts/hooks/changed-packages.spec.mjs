import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { changedPackages } from './changed-packages.mjs'

describe('changedPackages', () => {
  it('fans a common/ change out to common, api and app', () => {
    assert.deepEqual(changedPackages(['common/schedule/toEventDate.ts']), [
      'common',
      'api',
      'app',
    ])
  })

  it('maps an api/ change to api only', () => {
    assert.deepEqual(changedPackages(['api/src/features/event/event.routes.ts']), ['api'])
  })

  it('maps an app/ change to app only', () => {
    assert.deepEqual(changedPackages(['app/src/pages/Teams.tsx']), ['app'])
  })

  it('maps a mixed api and app change to both packages', () => {
    assert.deepEqual(changedPackages(['api/src/server.ts', 'app/src/main.tsx']), ['api', 'app'])
  })

  it('returns no packages for an empty diff', () => {
    assert.deepEqual(changedPackages([]), [])
  })

  it('returns no packages for a root-level change', () => {
    assert.deepEqual(changedPackages(['package.json', 'CLAUDE.md']), [])
  })

  it('fans out a common/ change even when mixed with root-level files', () => {
    assert.deepEqual(changedPackages(['README.md', 'common/permissions/index.ts']), [
      'common',
      'api',
      'app',
    ])
  })
})
