import type {
  TeamMembershipInput,
  TeamMembershipModel,
} from '../../../core/database/schemas/index.ts'

export interface TeamMembershipRepository {
  insertTeamMembership: (input: TeamMembershipInput) => Promise<TeamMembershipModel | undefined>
  selectTeamMembership: (id: string) => Promise<TeamMembershipModel | undefined>
  listTeamMemberships: () => Promise<TeamMembershipModel[]>
  deleteTeamMembership: (id: string) => Promise<TeamMembershipModel>
  selectByMemberAndTeam: (
    teamId: string,
    memberId: string
  ) => Promise<TeamMembershipModel | undefined>
}
