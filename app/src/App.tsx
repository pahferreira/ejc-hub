import { Route, Routes } from 'react-router'
import './App.css'
import { Welcome } from './pages/Welcome'
import { NotFound } from './pages/NotFound'
import { useRoutes } from './hooks/useRoutes/useRoutes'
import { AppLayout } from './AppLayout'
import { useAuthentication } from './hooks/useAuthentication'

function App() {
  const { isLoading } = useAuthentication()
  const { routes } = useRoutes()

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
