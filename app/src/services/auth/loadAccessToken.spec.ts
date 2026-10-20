import { describe, it, expect, vi } from 'vitest'
import { MissingRefreshTokenError } from '@auth0/auth0-react'
import { isSessionExpiredError, loadAccessToken } from './loadAccessToken'

describe('loadAccessToken', () => {
  it('skips the token request when the user is not authenticated', async () => {
    const getAccessTokenSilently = vi.fn()

    const result = await loadAccessToken({
      isLoading: false,
      isAuthenticated: false,
      getAccessTokenSilently,
    })

    expect(result).toEqual({ status: 'skipped' })
    expect(getAccessTokenSilently).not.toHaveBeenCalled()
  })

  it('skips the token request while auth0 is still loading', async () => {
    const getAccessTokenSilently = vi.fn()

    const result = await loadAccessToken({
      isLoading: true,
      isAuthenticated: true,
      getAccessTokenSilently,
    })

    expect(result).toEqual({ status: 'skipped' })
    expect(getAccessTokenSilently).not.toHaveBeenCalled()
  })

  it('returns the token when the request succeeds', async () => {
    const result = await loadAccessToken({
      isLoading: false,
      isAuthenticated: true,
      getAccessTokenSilently: vi.fn().mockResolvedValue('abc'),
    })

    expect(result).toEqual({ status: 'ok', token: 'abc' })
  })

  it.each(['missing_refresh_token', 'invalid_grant', 'login_required'])(
    'reports an expired session instead of throwing when auth0 fails with %s',
    async (code) => {
      const result = await loadAccessToken({
        isLoading: false,
        isAuthenticated: true,
        getAccessTokenSilently: vi.fn().mockRejectedValue({ error: code }),
      })

      expect(result).toEqual({ status: 'session-expired' })
    }
  )

  it('reports an unknown failure instead of throwing', async () => {
    const error = new Error('timeout')

    const result = await loadAccessToken({
      isLoading: false,
      isAuthenticated: true,
      getAccessTokenSilently: vi.fn().mockRejectedValue(error),
    })

    expect(result).toEqual({ status: 'failed', error })
  })
})

describe('isSessionExpiredError', () => {
  it('recognises the auth0 MissingRefreshTokenError', () => {
    const error = new MissingRefreshTokenError(
      'api.pontoejc.com',
      'openid profile email offline_access'
    )

    expect(isSessionExpiredError(error)).toBe(true)
  })

  it('recognises an error object carrying a session expiry code', () => {
    expect(isSessionExpiredError({ error: 'invalid_grant' })).toBe(true)
  })

  it('does not treat a plain error as an expired session', () => {
    expect(isSessionExpiredError(new Error('timeout'))).toBe(false)
  })

  it('does not treat null as an expired session', () => {
    expect(isSessionExpiredError(null)).toBe(false)
  })
})
