import { useEffect, useRef } from 'react'
import { Route, Routes } from 'react-router'
import { usePostHog } from '@posthog/react'
import './App.css'
import { Welcome } from './pages/Welcome'
import { NotFound } from './pages/NotFound'
import { useRoutes } from './hooks/useRoutes/useRoutes'
import { AppLayout } from './AppLayout'
import { useAuthentication } from './hooks/useAuthentication'

const isPostHogConfigured = Boolean(
  import.meta.env.VITE_PUBLIC_POSTHOG_PROJECT_TOKEN && import.meta.env.VITE_PUBLIC_POSTHOG_HOST
)

function App() {
  const { isLoading, isAuthenticated, user } = useAuthentication()
  const { routes } = useRoutes()
  const posthog = usePostHog()
  const identifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    if (
      !isPostHogConfigured ||
      !isAuthenticated ||
      !user?.sub ||
      identifiedUserId.current === user.sub
    ) {
      return
    }

    if (identifiedUserId.current) {
      posthog.reset()
    }

    posthog.identify(user.sub, {
      ...(user.email ? { email: user.email } : {}),
      ...(user.name ? { name: user.name } : {}),
    })
    identifiedUserId.current = user.sub
  }, [isAuthenticated, posthog, user?.email, user?.name, user?.sub])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route element={<AppLayout />}>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={<route.component />} />
        ))}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
