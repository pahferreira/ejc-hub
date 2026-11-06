import { describe, expect, it } from 'vitest'
import { getApiTracingHosts } from './apiHost'

describe('getApiTracingHosts', () => {
  it('returns the bare hostname for a local dev URL with a port', () => {
    expect(getApiTracingHosts('http://localhost:4000')).toEqual(['localhost'])
  })

  it('returns the bare hostname for an https production URL', () => {
    expect(getApiTracingHosts('https://api.pontoejc.com.br')).toEqual(['api.pontoejc.com.br'])
  })

  it('returns an empty list when the URL is undefined', () => {
    expect(getApiTracingHosts(undefined)).toEqual([])
  })

  it('returns an empty list when the URL is an empty string', () => {
    expect(getApiTracingHosts('')).toEqual([])
  })

  it('returns an empty list when the URL is unparseable', () => {
    expect(getApiTracingHosts('not a url')).toEqual([])
  })
})
