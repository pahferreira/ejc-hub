import { useAuth0 } from '@auth0/auth0-react'
import { usePostHog } from '@posthog/react'
import { jwtDecode } from 'jwt-decode'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { tokenHandler } from '../services/token'
import { loadAccessToken } from '../services/auth/loadAccessToken'
import { useSyncUserMutation } from '../services/users/useSyncUserMutation'
import { clearSubscriptionFormPersistence } from '../pages/EventSubscription/useSubscriptionFormPersistence/useSubscriptionFormPersistence'

const isPostHogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST
)

// Shared across every useAuthentication consumer so the user is synced once per login
// and an expired session triggers a single logout.
let syncedUserSub: string | null = null
let sessionExpiryInProgress = false

export function useAuthentication() {
  const { isLoading, isAuthenticated, getAccessTokenSilently, logout, user } = useAuth0()
  const [token, setToken] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const { mutate: syncUser } = useSyncUserMutation()
  const posthog = usePostHog()
  const location = useLocation()

  const clearLocalSession = () => {
    if (isPostHogConfigured) {
      posthog.reset()
    }
    tokenHandler.clearToken()
    syncedUserSub = null
  }

  const logoutToHome = () => logout({ logoutParams: { returnTo: window.location.origin } })

  // Re-runs on route changes so the token axios reads from localStorage stays fresh.
  useEffect(() => {
    let cancelled = false

    const refreshToken = async () => {
      const result = await loadAccessToken({ isLoading, isAuthenticated, getAccessTokenSilently })
      if (cancelled) {
        return
      }

      if (result.status === 'ok') {
        setToken(result.token)
        tokenHandler.setToken(result.token)
        if (user?.sub && syncedUserSub !== user.sub) {
          syncedUserSub = user.sub
          syncUser()
        }
      }

      if (result.status === 'session-expired' && !sessionExpiryInProgress) {
        sessionExpiryInProgress = true
        clearLocalSession()
        logoutToHome()
      }

      if (result.status === 'failed' && isPostHogConfigured) {
        posthog.captureException(result.error)
      }
    }

    refreshToken()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, getAccessTokenSilently, location.pathname])

  useEffect(() => {
    if (token) {
      const permissionsExtracted = extractPermissionsFromToken(token)
      setPermissions(permissionsExtracted)
    }
  }, [token])

  const handleLogout = () => {
    clearLocalSession()
    clearSubscriptionFormPersistence()
    logoutToHome()
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
