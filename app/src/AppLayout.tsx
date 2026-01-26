import { Outlet } from 'react-router'
import { Navbar } from './components/Navbar/Navbar'

type AppLayoutProps = {
  routes?: Array<{ name: string; to: string }>
}

export function AppLayout(props: AppLayoutProps) {
  return (
    <>
      <Navbar title="EJC Rosário" navItems={props.routes} />
      <Outlet />
    </>
  )
}
