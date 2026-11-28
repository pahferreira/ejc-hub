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
    // 18:19:30, twelve and a half minutes in.
    now: new Date('2026-04-03T21:19:30Z'),
    next: NEXT,
    // The 7-minute late start pushes Jantar to 18:52.
    nextForecastStartsAt: new Date('2026-04-03T21:52:00Z'),
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
    await expect(canvas.getByText(/Próxima:/)).toHaveTextContent('Próxima: Jantar às 18:52')
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** The timer counts down the effective duration, with the elapsed time and its bar. */
export const Timer: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('timer', { name: 'Tempo restante' })).toHaveTextContent(
      '● AO VIVO32:30'
    )
    await expect(canvas.getByText('Decorridos 12:30')).toBeVisible()
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '28')
    await expect(canvas.queryByText(/Excedeu em/)).not.toBeInTheDocument()
  },
}

/** Past its 45 minutes: "Excedeu em" and the "+N min" chip turn red and grow. */
export const Overrun: Story = {
  // 18:55:10, three minutes and ten seconds over.
  args: { now: new Date('2026-04-03T21:55:10Z') },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('timer', { name: 'Tempo excedido' })).toHaveTextContent(
      '● AO VIVO+03:10'
    )
    await expect(canvas.getByText('Excedeu em 03:10')).toBeVisible()
    await expect(canvas.getByText('+3 min')).toBeVisible()
    await expect(canvas.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  },
}

/** A trimmed activity counts down its effective duration. */
export const Trimmed: Story = {
  args: {
    activity: { ...RUNNING, adjustedDurationMinutes: 15, effectiveDurationMinutes: 15 },
  },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('timer', { name: 'Tempo restante' })
    ).toHaveTextContent('● AO VIVO02:30')
  },
}

/** An admin finishes the running activity. */
export const Admin: Story = {
  args: { onFinish: fn(), onUndoStart: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Marcar como concluída' }))
    await expect(args.onFinish).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Desfazer início' }))
    await expect(args.onUndoStart).toHaveBeenCalled()
  },
}

/** The day's last activity: no "Próxima" line. */
export const LastOfTheDay: Story = {
  args: { next: null },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByText(/Próxima:/)).not.toBeInTheDocument()
  },
}
