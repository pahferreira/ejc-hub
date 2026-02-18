import { useAuth0 } from '@auth0/auth0-react'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { tokenHandler } from '../services/token'

export function useAuthentication() {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const [token, setToken] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])

  getAccessTokenSilently().then((accessToken) => {
    if (accessToken !== token) {
      setToken(accessToken)
      tokenHandler.setToken(accessToken)
    }
  })

  useEffect(() => {
    if (token) {
      const permissionsExtracted = extractPermissionsFromToken(token)
      setPermissions(permissionsExtracted)
    }
  }, [token])

  return {
    isLoading,
    isAuthenticated: !isLoading && isAuthenticated,
    permissions,
    token,
  }
}

function extractPermissionsFromToken(token: string): string[] {
  const decodedToken = jwtDecode<{ permissions?: string[] }>(token)
  return decodedToken.permissions || []
}
