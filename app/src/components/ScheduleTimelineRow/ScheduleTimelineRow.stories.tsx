import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ScheduleTimelineRow } from './ScheduleTimelineRow'

const meta = {
  title: 'Schedule/ScheduleTimelineRow',
  component: ScheduleTimelineRow,
  args: {
    myTeamInstanceId: 't-cozinha',
    activity: {
      id: 'activity-1',
      title: 'Palestra: O amor de Deus',
      plannedStartsAt: '2026-04-03T21:00:00Z',
      durationMinutes: 45,
      place: 'Salão paroquial',
      guestName: 'Pe. João',
      adminsResponsible: false,
      teams: [
        {
          teamInstanceId: 't-liturgia',
          teamName: 'Liturgia',
          teamKey: 'liturgia',
          colorToken: 'violet',
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <ol className="m-0 list-none p-0">
        <Story />
      </ol>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleTimelineRow>

export default meta
type Story = StoryObj<typeof meta>

/** Another team's activity: no accent, no "Sua equipe". 18:00 for 45 min, until 18:45. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('18:00')).toBeVisible()
    await expect(canvas.getByText('45 min')).toBeVisible()
    await expect(canvas.getByText('até 18:45')).toBeVisible()
    await expect(canvas.getByText('Salão paroquial')).toBeVisible()
    await expect(canvas.getByText('Convidado: Pe. João')).toBeVisible()
    await expect(canvas.queryByText('Sua equipe')).not.toBeInTheDocument()
  },
}

/** The viewer's team is one of those responsible: accent border and "Sua equipe". */
export const MyTeam: Story = {
  args: {
    activity: {
      id: 'activity-2',
      title: 'Jantar',
      plannedStartsAt: '2026-04-03T22:00:00Z',
      durationMinutes: 60,
      place: 'Refeitório',
      guestName: null,
      adminsResponsible: false,
      teams: [
        {
          teamInstanceId: 't-cozinha',
          teamName: 'Cozinha',
          teamKey: 'cozinha',
          colorToken: 'amber',
        },
        {
          teamInstanceId: 't-liturgia',
          teamName: 'Liturgia',
          teamKey: 'liturgia',
          colorToken: 'violet',
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Cozinha')).toHaveClass('bg-primary')
    await expect(canvas.getByRole('article', { name: 'Jantar' })).toHaveClass('border-l-primary')
  },
}

/** The admins are responsible: an "Coord. Geral" chip. */
export const AdminsResponsible: Story = {
  args: {
    myTeamInstanceId: null,
    activity: {
      id: 'activity-3',
      title: 'Abertura',
      plannedStartsAt: '2026-04-03T20:00:00Z',
      durationMinutes: 30,
      place: 'Igreja',
      guestName: null,
      adminsResponsible: true,
      teams: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Coord. Geral')).toBeVisible()
  },
}
