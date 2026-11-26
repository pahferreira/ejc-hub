import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import { ScheduleHappeningNowCard } from './ScheduleHappeningNowCard'

// Planned for 18:00 in São Paulo, started at 18:07.
const RUNNING: ScheduleActivity = {
  id: 'activity-1',
  title: 'Palestra: O amor de Deus',
  plannedStartsAt: '2026-04-03T21:00:00Z',
  durationMinutes: 45,
  place: 'Salão paroquial',
  guestName: 'Pe. João',
  adminsResponsible: false,
  allTeams: false,
  teams: [
    {
      teamInstanceId: 't-liturgia',
      teamName: 'Liturgia',
      teamKey: 'liturgia',
      colorToken: 'violet',
    },
  ],
  status: 'running',
  actualStartedAt: '2026-04-03T21:07:00Z',
  actualEndedAt: null,
  adjustedDurationMinutes: null,
  effectiveDurationMinutes: 45,
  notes: [],
}

const NEXT: ScheduleActivity = {
  ...RUNNING,
  id: 'activity-2',
  title: 'Jantar',
  plannedStartsAt: '2026-04-03T21:45:00Z',
  place: 'Refeitório',
  guestName: null,
  status: 'planned',
  actualStartedAt: null,
}

const meta = {
  title: 'Schedule/ScheduleHappeningNowCard',
  component: ScheduleHappeningNowCard,
  args: {
    activity: RUNNING,
    next: NEXT,
    myTeamInstanceId: 't-liturgia',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleHappeningNowCard>

export default meta
type Story = StoryObj<typeof meta>

/** What members and coordinators see: no button. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('● ACONTECENDO AGORA')).toBeVisible()
    await expect(canvas.getByText('Palestra: O amor de Deus')).toBeVisible()
    await expect(canvas.getByText('Convidado: Pe. João')).toBeVisible()
    await expect(canvas.getByText('Previsto 18:00 · Iniciado 18:07')).toBeVisible()
    await expect(canvas.getByText(/Próxima:/)).toHaveTextContent('Próxima: Jantar às 18:45')
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** An admin finishes the running activity. */
export const Admin: Story = {
  args: { onFinish: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Marcar como concluída' }))
    await expect(args.onFinish).toHaveBeenCalled()
  },
}

/** The day's last activity: no "Próxima" line. */
export const LastOfTheDay: Story = {
  args: { next: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText(/Próxima:/)).not.toBeInTheDocument()
  },
}
