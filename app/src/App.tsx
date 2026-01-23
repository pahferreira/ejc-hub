import { BrowserRouter, Route, Routes } from 'react-router'
import './App.css'
import { Home } from './pages/Home'
import { useRoutes } from './hooks/useRoutes'
import { AppLayout } from './AppLayout'

function App() {
  const { routes } = useRoutes()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route element={<AppLayout routes={routes.map((r) => ({ name: r.name, to: r.path }))} />}>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={<route.component />} />
          ))}
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
