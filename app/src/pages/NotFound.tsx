import { Link, Navigate } from 'react-router'
import { useAuthentication } from '../hooks/useAuthentication'

export function NotFound() {
  const { isAuthenticated } = useAuthentication()
  console.log('###pages/NotFound.tsx line:6 isAuthenticated HERE###', isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/">Go back to home</Link>
    </div>
  )
}
