import { Link, Navigate } from 'react-router'
import { useAuthentication } from '../hooks/useAuthentication'

export function NotFound() {
  const { isAuthenticated } = useAuthentication()

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="text-center p-8">
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/">Go back to home</Link>
    </div>
  )
}
