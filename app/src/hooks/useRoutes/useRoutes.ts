import { routes } from './routes'
import { useAuthentication } from '../useAuthentication'
import { FeatureFlag } from '../useFeatureFlag/feature-flags'
import { useFeatureFlag } from '../useFeatureFlag/useFeatureFlag'
import { hasPermission } from '../../../../common/permissions'

export function useRoutes() {
  const { isAuthenticated, permissions } = useAuthentication()
  const { isFeatureEnabled } = useFeatureFlag()
  const myTeamEnabled = isFeatureEnabled(FeatureFlag.MyTeam, false)

  if (!isAuthenticated) {
    return { routes: [] }
  }

  return {
    routes: routes.filter((route) => {
      if (route.permission && !hasPermission(permissions, route.permission)) {
        return false
      }

      if (route.requiresMyTeamFlag && !myTeamEnabled) {
        return false
      }

      return true
    }),
  }
}
