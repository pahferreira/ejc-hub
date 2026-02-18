type RefreshTokenFunction = () => Promise<string>

let refreshTokenCallback: RefreshTokenFunction | null = null

const setRefreshTokenFunction = (callback: RefreshTokenFunction) => {
  refreshTokenCallback = callback
}

export const tokenHandler = {
  getToken: () => localStorage.getItem('token') || '',
  setToken: (token: string) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),
  refreshToken: () => {
    if (!refreshTokenCallback) {
      throw new Error('Refresh token function not set')
    }
    return refreshTokenCallback()
  },
  setRefreshTokenFunction,
}
