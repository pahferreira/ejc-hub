import { describe, it, expect } from 'vitest'
import { hasPermission } from './hasPermission'
import { ScheduleNotePermissions, SchedulePermissions, type Permission } from '../permissions.types'

describe('hasPermission', () => {
  it('should return true if user has the required permission', () => {
    const userPermissions = ['read', 'write', 'delete']
    const requiredPermission = 'write'

    const result = hasPermission(userPermissions, requiredPermission)
    expect(result).toBe(true)
  })

  it('should return false if user does not have the required permission', () => {
    const userPermissions = ['read', 'write']
    const requiredPermission = 'delete'

    const result = hasPermission(userPermissions, requiredPermission)
    expect(result).toBe(false)
  })

  it('checks the running schedule permissions by their Auth0 strings', () => {
    const notePermissions: Permission[] = ['schedule-note:create', 'schedule-note:read']

    expect(hasPermission(notePermissions, ScheduleNotePermissions.Read)).toBe(true)
    expect(hasPermission(notePermissions, ScheduleNotePermissions.Create)).toBe(true)
    expect(hasPermission(notePermissions, SchedulePermissions.Control)).toBe(false)
    expect(hasPermission(['schedule:control'], SchedulePermissions.Control)).toBe(true)
  })
})
