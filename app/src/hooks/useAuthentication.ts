import { useAuth0 } from '@auth0/auth0-react'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useRef, useState } from 'react'
import { tokenHandler } from '../services/token'
import { useSyncUserMutation } from '../services/users/useSyncUserMutation'

export function useAuthentication() {
  const { isLoading, isAuthenticated, getAccessTokenSilently, logout, user } = useAuth0()
  const [token, setToken] = useState('')
  const userSynced = useRef(false)
  const [permissions, setPermissions] = useState<string[]>([])
  const { mutate: syncUser } = useSyncUserMutation()

  getAccessTokenSilently().then((accessToken) => {
    if (accessToken !== token) {
      setToken(accessToken)
      tokenHandler.setToken(accessToken)
      if (!userSynced.current) {
        userSynced.current = true
        syncUser()
      }
    }
  })

  useEffect(() => {
    if (token) {
      const permissionsExtracted = extractPermissionsFromToken(token)
      setPermissions(permissionsExtracted)
    }
  }, [token, syncUser])

  const handleLogout = () => {
    tokenHandler.clearToken()
    userSynced.current = false
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return {
    isLoading,
    isAuthenticated: !isLoading && isAuthenticated,
    permissions,
    token,
    user,
    logout: handleLogout,
  }
}

function extractPermissionsFromToken(token: string): string[] {
  const decodedToken = jwtDecode<{ permissions?: string[] }>(token)
  return decodedToken.permissions || []
}
