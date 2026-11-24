import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleTimelineRow } from './ScheduleTimelineRow'

const NO_CONTROLS = {
  start: false,
  finish: false,
  skip: false,
  undoStart: false,
  reopen: false,
  undoSkip: false,
}

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
      allTeams: false,
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
      status: 'planned',
      actualStartedAt: null,
      actualEndedAt: null,
      adjustedDurationMinutes: null,
      effectiveDurationMinutes: 60,
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
      allTeams: false,
      teams: [],
      status: 'planned',
      actualStartedAt: null,
      actualEndedAt: null,
      adjustedDurationMinutes: null,
      effectiveDurationMinutes: 30,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Coord. Geral')).toBeVisible()
  },
}

/** Live, the running activity: the chip, a filled dot, and an admin's "✓ Concluir" and "Desfazer início". */
export const Running: Story = {
  args: {
    live: true,
    controls: { ...NO_CONTROLS, finish: true, undoStart: true },
    onFinish: fn(),
    onUndo: fn(),
    activity: {
      ...meta.args.activity,
      status: 'running',
      actualStartedAt: '2026-04-03T21:05:00Z',
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('● ACONTECENDO AGORA')).toBeVisible()
    await expect(canvas.getByTestId('timeline-dot')).toHaveClass('bg-primary')
    await userEvent.click(canvas.getByRole('button', { name: '✓ Concluir' }))
    await expect(args.onFinish).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: 'Desfazer início' }))
    await expect(args.onUndo).toHaveBeenCalled()
  },
}

/** Live, a done activity: muted, "CONCLUÍDO", and its actual times (18:05 until 18:52). */
export const Done: Story = {
  args: {
    live: true,
    activity: {
      ...meta.args.activity,
      status: 'done',
      actualStartedAt: '2026-04-03T21:05:00Z',
      actualEndedAt: '2026-04-03T21:52:00Z',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('CONCLUÍDO')).toBeVisible()
    await expect(canvas.getByText('18:05')).toBeVisible()
    await expect(canvas.getByText('até 18:52')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** Live, the day's next planned activity, for an admin: "▶ Iniciar" and "⏭ Pular". */
export const NextPlanned: Story = {
  args: {
    live: true,
    controls: { ...NO_CONTROLS, start: true, skip: true },
    onStart: fn(),
    onSkip: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText('CONCLUÍDO')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '▶ Iniciar' }))
    await expect(args.onStart).toHaveBeenCalled()
    await userEvent.click(canvas.getByRole('button', { name: '⏭ Pular' }))
    await expect(args.onSkip).toHaveBeenCalled()
  },
}

/** Live, a later planned activity, for an admin: "⏭ Pular" only. */
export const LaterPlanned: Story = {
  args: {
    live: true,
    controls: { ...NO_CONTROLS, skip: true },
    onSkip: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('button', { name: '⏭ Pular' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: '▶ Iniciar' })).not.toBeInTheDocument()
  },
}

/** Live, the most recently finished activity while nothing runs: an admin's "↻ Reabrir". */
export const DoneReopenable: Story = {
  args: {
    live: true,
    controls: { ...NO_CONTROLS, reopen: true },
    onUndo: fn(),
    activity: {
      ...meta.args.activity,
      status: 'done',
      actualStartedAt: '2026-04-03T21:05:00Z',
      actualEndedAt: '2026-04-03T21:52:00Z',
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: '↻ Reabrir' }))
    await expect(args.onUndo).toHaveBeenCalled()
  },
}

/** Live, a skipped activity: dashed card and dot, "PULADA", a struck-through title. */
export const Skipped: Story = {
  args: {
    live: true,
    activity: { ...meta.args.activity, status: 'skipped' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('PULADA')).toBeVisible()
    await expect(canvas.getByText('Palestra: O amor de Deus')).toHaveClass('line-through')
    await expect(canvas.getByRole('article', { name: 'Palestra: O amor de Deus' })).toHaveClass(
      'border-dashed'
    )
    await expect(canvas.getByTestId('timeline-dot')).toHaveClass('border-dashed')
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}

/** Live, a skipped activity nothing later has overtaken, for an admin: "↶ Desfazer". */
export const SkippedUndoable: Story = {
  args: {
    live: true,
    controls: { ...NO_CONTROLS, undoSkip: true },
    onUndo: fn(),
    activity: { ...meta.args.activity, status: 'skipped' },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: '↶ Desfazer' }))
    await expect(args.onUndo).toHaveBeenCalled()
  },
}

/** Live, the running activity as a member or coordinator sees it: no buttons. */
export const RunningForMembers: Story = {
  args: {
    live: true,
    activity: {
      ...meta.args.activity,
      status: 'running',
      actualStartedAt: '2026-04-03T21:05:00Z',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('● ACONTECENDO AGORA')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}
