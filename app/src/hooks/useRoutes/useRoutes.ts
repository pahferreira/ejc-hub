import { routes } from './routes'
import { useAuthentication } from '../useAuthentication'
import { hasPermission } from '../../../../common/permissions'

export function useRoutes() {
  const { isAuthenticated, permissions } = useAuthentication()

  if (!isAuthenticated) {
    return { routes: [] }
  }

  return {
    routes: routes.filter((route) => {
      if (!route.permission) {
        return true
      }

      return hasPermission(permissions, route.permission)
    }),
  }
}
