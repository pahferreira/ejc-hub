import { routes } from './routes'
import { useAuthentication } from '../useAuthentication'
import { useFeatureFlag } from '../useFeatureFlag/useFeatureFlag'
import { hasPermission } from '../../../../common/permissions'

export function useRoutes() {
  const { isAuthenticated, permissions } = useAuthentication()
  const { isFeatureEnabled } = useFeatureFlag()

  if (!isAuthenticated) {
    return { routes: [] }
  }

  return {
    routes: routes.filter((route) => {
      if (route.permission && !hasPermission(permissions, route.permission)) {
        return false
      }

      if (route.featureFlag && !isFeatureEnabled(route.featureFlag, false)) {
        return false
      }

      if (
        route.anyFeatureFlag &&
        !route.anyFeatureFlag.some((flag) => isFeatureEnabled(flag, false))
      ) {
        return false
      }

      return true
    }),
  }
}
