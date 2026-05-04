import type { ReactNode } from 'react'
import { Auth0Provider } from '@auth0/auth0-react'
import { useNavigate } from 'react-router'
import { ROUTE_PATHS } from './constants/routePaths'

type AppState = { returnTo?: string }

type Auth0ProviderWithNavigateProps = {
  children: ReactNode
}

export function Auth0ProviderWithNavigate(props: Auth0ProviderWithNavigateProps) {
  const navigate = useNavigate()

  const onRedirectCallback = (appState?: AppState) =>
    navigate(appState?.returnTo ?? ROUTE_PATHS.SUBSCRIPTIONS_NEW, { replace: true })

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: 'openid profile email',
      }}
      cacheLocation="localstorage"
      useRefreshTokens
      onRedirectCallback={onRedirectCallback}
    >
      {props.children}
    </Auth0Provider>
  )
}
