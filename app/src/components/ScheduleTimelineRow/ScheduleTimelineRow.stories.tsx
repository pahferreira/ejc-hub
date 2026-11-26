import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
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
      notes: [],
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
      notes: [],
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
      notes: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Coord. Geral')).toBeVisible()
  },
}

/** Live, the running activity: the chip, a filled dot, and an admin's "✓ Concluir". */
export const Running: Story = {
  args: {
    live: true,
    controls: { start: false, finish: true },
    onFinish: fn(),
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

/** Live, the day's next planned activity, for an admin: "▶ Iniciar". */
export const NextPlanned: Story = {
  args: {
    live: true,
    controls: { start: true, finish: false },
    onStart: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText('CONCLUÍDO')).not.toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: '▶ Iniciar' }))
    await expect(args.onStart).toHaveBeenCalled()
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

/** Live, for an admin or coordinator, with no notes yet: a plain "✎ Nota" button. */
export const NoteButtonWithoutNotes: Story = {
  args: {
    live: true,
    onAddNote: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: '✎ Nota' })

    await expect(button).not.toHaveClass('bg-amber-100')
    await userEvent.click(button)
    await expect(args.onAddNote).toHaveBeenCalled()
  },
}

/** Live, with notes: they stack under the row and the "✎ Nota" button turns yellow. */
export const WithNotes: Story = {
  args: {
    live: true,
    onAddNote: fn(),
    activity: {
      ...meta.args.activity,
      notes: [
        {
          id: 'note-1',
          body: 'Levar os violões para o salão antes das 18h.',
          authorName: 'Ana',
          authorRole: 'coordinator',
          createdAt: '2026-04-03T17:32:00Z',
        },
        {
          id: 'note-2',
          body: 'O padre chega 5 minutos atrasado.',
          authorName: 'Bruno',
          authorRole: 'admin',
          createdAt: '2026-04-03T17:40:00Z',
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Ana (coordenação) · 14:32')).toBeVisible()
    await expect(canvas.getByText('Bruno (administração) · 14:40')).toBeVisible()
    await expect(canvas.getByRole('button', { name: '✎ Nota' })).toHaveClass('bg-amber-100')
  },
}

/** Live, a member reads their coordinators' notes but has no "✎ Nota" button. */
export const NotesForMembers: Story = {
  args: {
    live: true,
    activity: {
      ...meta.args.activity,
      notes: [
        {
          id: 'note-1',
          body: 'Levar os violões para o salão antes das 18h.',
          authorName: 'Ana',
          authorRole: 'coordinator',
          createdAt: '2026-04-03T17:32:00Z',
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Ana (coordenação) · 14:32')).toBeVisible()
    await expect(canvas.queryByRole('button')).not.toBeInTheDocument()
  },
}
