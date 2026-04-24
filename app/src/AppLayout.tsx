import { Outlet } from 'react-router'
import { Sidebar } from './components/Sidebar/Sidebar'
import { Toaster } from 'sonner'

export function AppLayout() {
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
