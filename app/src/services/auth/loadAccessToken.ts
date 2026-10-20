type LoadAccessTokenParams = {
  isLoading: boolean
  isAuthenticated: boolean
  getAccessTokenSilently: () => Promise<string>
}

export type LoadAccessTokenResult =
  | { status: 'skipped' }
  | { status: 'ok'; token: string }
  | { status: 'session-expired' }
  | { status: 'failed'; error: unknown }

// Auth0 error codes meaning the session can no longer be renewed silently.
// Matched on `error.error` so it covers MissingRefreshTokenError and GenericError alike.
const SESSION_EXPIRED_ERROR_CODES = ['missing_refresh_token', 'invalid_grant', 'login_required']

export const isSessionExpiredError = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null || !('error' in error)) {
    return false
  }
  return SESSION_EXPIRED_ERROR_CODES.includes(String(error.error))
}

export const loadAccessToken = async (
  params: LoadAccessTokenParams
): Promise<LoadAccessTokenResult> => {
  if (params.isLoading || !params.isAuthenticated) {
    return { status: 'skipped' }
  }

  try {
    const token = await params.getAccessTokenSilently()
    return { status: 'ok', token }
  } catch (error) {
    if (isSessionExpiredError(error)) {
      return { status: 'session-expired' }
    }
    return { status: 'failed', error }
  }
}
