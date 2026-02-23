import { Outlet } from 'react-router'
import { Navbar } from './components/Navbar/Navbar'
import { useAuthentication } from './hooks/useAuthentication'

type AppLayoutProps = {
  routes?: Array<{ name: string; to: string }>
}

export function AppLayout(props: AppLayoutProps) {
  const { logout } = useAuthentication()

  return (
    <>
      <Navbar
        title="EJC Rosário"
        navItems={props.routes}
        logout={{ label: 'Sair', onClick: logout }}
      />
      <Outlet />
    </>
  )
}
