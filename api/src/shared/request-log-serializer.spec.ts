import { describe, it, expect } from 'vitest'
import { serializeRequestForLog } from './request-log-serializer.ts'

describe('serializeRequestForLog', () => {
  const request = {
    id: 'req-1',
    method: 'POST',
    url: '/events',
    headers: {
      authorization: 'Bearer eyJhbGciOi.jwt.payload',
      cookie: 'session=abc; refresh=def',
      'user-agent': 'Mozilla/5.0',
    },
    body: { email: 'maria@example.com' },
  }

  it('keeps the routing fields', () => {
    expect(serializeRequestForLog(request)).toEqual({
      id: 'req-1',
      method: 'POST',
      url: '/events',
    })
  })

  it('never emits the authorization header or the JWT it carries', () => {
    const serialized = JSON.stringify(serializeRequestForLog(request))

    expect(serialized).not.toContain('authorization')
    expect(serialized).not.toContain('Bearer')
    expect(serialized).not.toContain('eyJhbGciOi')
  })

  it('never emits cookies', () => {
    const serialized = JSON.stringify(serializeRequestForLog(request))

    expect(serialized).not.toContain('cookie')
    expect(serialized).not.toContain('session=abc')
  })

  it('never emits the request body', () => {
    const serialized = JSON.stringify(serializeRequestForLog(request))

    expect(serialized).not.toContain('maria@example.com')
  })
})
