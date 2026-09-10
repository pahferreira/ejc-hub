import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamDetailContent } from './TeamDetailContent'
import { Button } from '../Button/Button'
import type { TeamDetail, TeamRosterPerson } from '../../services/teams/teams.types'

const person = (
  overrides: Partial<TeamRosterPerson> & Pick<TeamRosterPerson, 'userId' | 'name'>
): TeamRosterPerson => ({
  nickname: overrides.name,
  phone: '(11) 91000-4000',
  pictureUrl: null,
  experienceType: 'experienced',
  circleKey: null,
  areas: ['Liderança', 'Organização'],
  preferences: [],
  weekAvailability: ['monday', 'wednesday', 'friday'],
  eventFeeStatus: 'pending',
  ...overrides,
})

const team: TeamDetail = {
  id: 'instance-1',
  templateKey: 'liturgia',
  name: 'Liturgia',
  description: 'Prepara e conduz momentos de oração e celebrações.',
  memberCount: 8,
  maxCapacity: 15,
  freeSlots: 7,
  filledPercentage: 53,
  coordinatorSlots: 3,
  coordinators: [
    person({ userId: 'coord-1', name: 'Maria Silva', nickname: 'Mari', eventFeeStatus: 'paid' }),
    person({ userId: 'coord-2', name: 'João Santos', nickname: 'Joca' }),
  ],
  members: [
    person({ userId: 'm-1', name: 'Alice Santos', nickname: 'Ali', experienceType: 'newbie' }),
    person({ userId: 'm-2', name: 'Júlia Barbosa', nickname: 'Ju', eventFeeStatus: 'paid' }),
    person({ userId: 'm-3', name: 'Mariana Martins', nickname: 'Mari' }),
  ],
}

const meta = {
  title: 'UI/TeamDetailContent',
  component: TeamDetailContent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TeamDetailContent>

export default meta
type Story = StoryObj<typeof meta>

/** Read-only: no action slots — how the "Minha Equipe" page renders. */
export const ReadOnly: Story = {
  args: {
    team,
  },
}

/** With admin actions — how the Team Detail page renders. */
export const WithActions: Story = {
  args: {
    team,
    coordinatorsAction: <Button>+ Adicionar Coordenador</Button>,
    membersAction: <Button>+ Adicionar Membro</Button>,
    onRemoveMember: () => {},
  },
}
