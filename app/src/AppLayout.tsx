import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Sidebar } from './components/Sidebar/Sidebar.tsx'
import { MobileSidebarTrigger } from './components/Sidebar/MobileSidebarTrigger.tsx'
import { Toaster } from 'sonner'
import { ROUTE_PATHS } from './constants/routePaths'
import { DESKTOP_MEDIA_QUERY } from './constants/breakpoints'
import { useMediaQuery } from './hooks/useMediaQuery'

export function AppLayout() {
  const location = useLocation()
  const isDesktop = useMediaQuery(DESKTOP_MEDIA_QUERY)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const isFocusedRoute = location.pathname === ROUTE_PATHS.SUBSCRIPTIONS_NEW

  // Navigating from inside the overlay should leave it behind.
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  // Growing past the breakpoint brings the rail back, so the overlay — and the
  // scroll lock and focus trap that come with it — has to go.
  useEffect(() => {
    if (isDesktop) {
      setIsMobileMenuOpen(false)
    }
  }, [isDesktop])

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
      <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />
      {/*
        The trigger sits outside `main` on purpose: `main` is a scroll container
        (`overflow-auto`), and a `sticky` child would be pinned to that box
        instead of the viewport.
      */}
      <div className="flex flex-1 flex-col">
        <MobileSidebarTrigger isOpen={isMobileMenuOpen} onOpen={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto bg-dashboard-background">
          <Toaster />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
