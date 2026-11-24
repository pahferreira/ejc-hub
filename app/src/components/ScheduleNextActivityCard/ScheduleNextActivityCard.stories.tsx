import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleNextActivityCard } from './ScheduleNextActivityCard'

const meta = {
  title: 'Schedule/ScheduleNextActivityCard',
  component: ScheduleNextActivityCard,
  args: {
    myTeamInstanceId: null,
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

    await expect(canvas.getByText('PRÓXIMA ATIVIDADE · 18:00')).toBeVisible()
    await expect(canvas.getByText('Salão paroquial · Convidado: Pe. João')).toBeVisible()
    await expect(canvas.getByText('Liturgia')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** An admin starts or skips the next activity. Nothing has finished: no Reabrir. */
export const Admin: Story = {
  args: { onStart: fn(), onSkip: fn() },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText(/Reabrir/)).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '▶ Iniciar agora' }))
    await expect(args.onStart).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: '⏭ Pular' }))
    await expect(args.onSkip).toHaveBeenCalled()
  },
}

/** Nothing runs and an activity finished: the admin can reopen it from here. */
export const AdminWithReopen: Story = {
  args: {
    onStart: fn(),
    onSkip: fn(),
    reopen: { title: 'Abertura', onReopen: fn() },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: '↻ Reabrir Abertura' }))
    await expect(args.reopen?.onReopen).toHaveBeenCalled()
  },
}
