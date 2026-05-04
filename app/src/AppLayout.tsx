import { Outlet, useLocation } from 'react-router'
import { Sidebar } from './components/Sidebar/Sidebar.tsx'
import { Toaster } from 'sonner'
import { ROUTE_PATHS } from './constants/routePaths'

export function AppLayout() {
  const location = useLocation()
  const isFocusedRoute = location.pathname === ROUTE_PATHS.SUBSCRIPTIONS_NEW

  if (isFocusedRoute) {
    return (
      <main className="min-h-screen overflow-auto">
        <Toaster />
        <Outlet />
      </main>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Toaster />
        <Outlet />
      </main>
    </div>
  )
}
