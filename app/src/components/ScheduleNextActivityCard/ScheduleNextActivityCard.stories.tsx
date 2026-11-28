import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleNextActivityCard } from './ScheduleNextActivityCard'

const meta = {
  title: 'Schedule/ScheduleNextActivityCard',
  component: ScheduleNextActivityCard,
  args: {
    myTeamInstanceId: null,
    // Planned for 18:00 in São Paulo; it is 17:48.
    forecastStartsAt: new Date('2026-04-03T21:00:00Z'),
    now: new Date('2026-04-03T20:48:00Z'),
    activity: {
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
      status: 'planned',
      actualStartedAt: null,
      actualEndedAt: null,
      adjustedDurationMinutes: null,
      effectiveDurationMinutes: 45,
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleNextActivityCard>

export default meta
type Story = StoryObj<typeof meta>

/** What members and coordinators see: no button. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Próxima atividade · 18:00')).toBeVisible()
    await expect(canvas.getByText('Salão paroquial · Convidado: Pe. João')).toBeVisible()
    await expect(canvas.getByText('Liturgia')).toBeVisible()
    await expect(canvas.getByText('Começa às 18:00 — em 12 min')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** The day runs late: the Previsão moves and the drift chip shows it. */
export const Late: Story = {
  args: { forecastStartsAt: new Date('2026-04-03T21:19:00Z') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Começa às 18:19 — em 31 min')).toBeVisible()
    await expect(canvas.getByText('+19 min')).toBeVisible()
  },
}

/** The day runs early: the drift chip is negative. */
export const Early: Story = {
  args: { forecastStartsAt: new Date('2026-04-03T20:50:00Z') },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('-10 min')).toBeVisible()
  },
}

/** "Próxima da sua equipe": the viewer's team's next activity, without controls. */
export const ForMyTeam: Story = {
  args: {
    forMyTeam: true,
    myTeamInstanceId: 't-liturgia',
    forecastStartsAt: new Date('2026-04-03T21:07:00Z'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('region', { name: 'Próxima da sua equipe' })).toBeVisible()
    await expect(canvas.getByText('Próxima da sua equipe · 18:00')).toBeVisible()
    await expect(canvas.getByText('Começa às 18:07 — em 19 min')).toBeVisible()
    await expect(canvas.getByText('+7 min')).toBeVisible()
  },
}

/** An admin starts the next activity. */
export const Admin: Story = {
  args: { onStart: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Iniciar agora' }))
    await expect(args.onStart).toHaveBeenCalled()
  },
}
