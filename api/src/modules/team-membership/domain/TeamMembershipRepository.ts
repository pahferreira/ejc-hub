import type {
  TeamMembershipInput,
  TeamMembershipModel,
} from '../../../core/database/schemas/index.ts'
import type { DbExecutor } from '../../../core/database/client.ts'

export interface TeamMembershipRepository {
  insertTeamMembership: (
    input: TeamMembershipInput,
    executor?: DbExecutor
  ) => Promise<TeamMembershipModel | undefined>
  selectTeamMembership: (id: string) => Promise<TeamMembershipModel | undefined>
  listTeamMemberships: () => Promise<TeamMembershipModel[]>
  deleteTeamMembership: (id: string, executor?: DbExecutor) => Promise<TeamMembershipModel>
  selectByMemberAndTeam: (
    teamId: string,
    memberId: string
  ) => Promise<TeamMembershipModel | undefined>
  deleteByMemberAndTeam: (
    teamId: string,
    memberId: string,
    executor?: DbExecutor
  ) => Promise<TeamMembershipModel | undefined>
  listMemberUserIdsByTeamInstanceIds: (teamInstanceIds: string[]) => Promise<Map<string, string[]>>
}
