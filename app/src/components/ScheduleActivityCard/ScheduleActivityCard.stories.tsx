import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test'
import { ScheduleActivityCard } from './ScheduleActivityCard'

const meta = {
  title: 'Schedule/ScheduleActivityCard',
  component: ScheduleActivityCard,
  args: {
    onEdit: fn(),
    activity: {
      id: 'activity-1',
      title: 'Acolhida dos encontristas',
      plannedStartsAt: '2026-04-03T21:00:00Z',
      durationMinutes: 30,
      place: 'Salão paroquial',
      guestName: null,
      adminsResponsible: false,
      allTeams: false,
      teams: [
        { teamInstanceId: 't1', teamName: 'Acolhida', teamKey: 'acolhida', colorToken: 'rose' },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleActivityCard>

export default meta
type Story = StoryObj<typeof meta>

/** 18:00 start, 30 min, one team. The pencil opens edit. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('18:00')).toBeInTheDocument()
    await expect(canvas.getByText('18:30')).toBeInTheDocument()
    await expect(canvas.getByText('30 min')).toBeInTheDocument()

    await userEvent.click(canvas.getByRole('button', { name: /Editar/ }))
    await expect(args.onEdit).toHaveBeenCalledWith('activity-1')
  },
}

/** Teams, the admins and a guest all responsible, duration shown as "1h15". */
export const AllResponsible: Story = {
  args: {
    activity: {
      id: 'activity-2',
      title: 'Palestra e dinâmica',
      plannedStartsAt: '2026-04-03T23:00:00Z',
      durationMinutes: 75,
      place: 'Auditório',
      guestName: 'Padre João',
      adminsResponsible: true,
      allTeams: false,
      teams: [
        { teamInstanceId: 't1', teamName: 'Liturgia', teamKey: 'liturgia', colorToken: 'violet' },
        { teamInstanceId: 't2', teamName: 'Música', teamKey: 'musica', colorToken: 'sky' },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('1h15')).toBeInTheDocument()
    await expect(canvas.getByText('Coord. Geral')).toBeInTheDocument()
    await expect(canvas.getByText('Convidado: Padre João')).toBeInTheDocument()
  },
}

/** A last activity that crosses midnight: start 23:00, end 00:30. */
export const CrossesMidnight: Story = {
  args: {
    activity: {
      id: 'activity-3',
      title: 'Adoração',
      plannedStartsAt: '2026-04-04T02:00:00Z',
      durationMinutes: 90,
      place: 'Capela',
      guestName: null,
      adminsResponsible: true,
      allTeams: false,
      teams: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('23:00')).toBeInTheDocument()
    await expect(canvas.getByText('00:30')).toBeInTheDocument()
  },
}

const TWELVE_TEAMS = [
  { teamInstanceId: 't1', teamName: 'Acolhida', teamKey: 'acolhida', colorToken: 'rose' },
  { teamInstanceId: 't2', teamName: 'Liturgia', teamKey: 'liturgia', colorToken: 'violet' },
  { teamInstanceId: 't3', teamName: 'Música', teamKey: 'musica', colorToken: 'sky' },
  { teamInstanceId: 't4', teamName: 'Cozinha', teamKey: 'cozinha', colorToken: 'amber' },
  { teamInstanceId: 't5', teamName: 'Ordem', teamKey: 'ordem', colorToken: 'emerald' },
  { teamInstanceId: 't6', teamName: 'Lanche', teamKey: 'lanche', colorToken: 'orange' },
  { teamInstanceId: 't7', teamName: 'Secretaria', teamKey: 'secretaria', colorToken: 'teal' },
  { teamInstanceId: 't8', teamName: 'Sala', teamKey: 'sala', colorToken: 'indigo' },
  { teamInstanceId: 't9', teamName: 'Compras', teamKey: 'compras', colorToken: 'lime' },
  { teamInstanceId: 't10', teamName: 'Teatro', teamKey: 'teatro', colorToken: 'pink' },
  { teamInstanceId: 't11', teamName: 'Vigília', teamKey: 'vigilia', colorToken: 'rose' },
  { teamInstanceId: 't12', teamName: 'Recepção', teamKey: 'recepcao', colorToken: 'sky' },
]

/**
 * Twelve hand-picked teams: four chips inline, eight behind "+8". The admins
 * and guest chips sit outside the truncated list, so they never fold away. The
 * popover is portalled out of the canvas, so it is asserted against `screen`.
 */
export const ManyTeams: Story = {
  args: {
    activity: {
      id: 'activity-4',
      title: 'Plenária de abertura',
      plannedStartsAt: '2026-04-03T22:00:00Z',
      durationMinutes: 60,
      place: 'Auditório',
      guestName: 'Padre João',
      adminsResponsible: true,
      allTeams: false,
      teams: TWELVE_TEAMS,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Cozinha')).toBeVisible()
    await expect(canvas.queryByText('Ordem')).not.toBeInTheDocument()
    await expect(canvas.getByText('Coord. Geral')).toBeVisible()
    await expect(canvas.getByText('Convidado: Padre João')).toBeVisible()

    const trigger = canvas.getByRole('button', { name: 'mais 8 equipes' })
    await expect(trigger).toHaveTextContent('+8')

    await userEvent.click(trigger)

    // `waitFor`: the panel opens through an opacity transition (see the
    // `TruncatedPillList` stories).
    await waitFor(() => expect(screen.getByText('Ordem')).toBeVisible())
    await expect(screen.getByText('Recepção')).toBeVisible()
  },
}

/** Every team of the event: one neutral "Todas as equipes" chip, with no color dot. */
export const AllTeams: Story = {
  args: {
    activity: {
      id: 'activity-5',
      title: 'Plenária',
      plannedStartsAt: '2026-04-04T12:00:00Z',
      durationMinutes: 60,
      place: 'Salão paroquial',
      guestName: null,
      adminsResponsible: false,
      allTeams: true,
      teams: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const chip = canvas.getByText('Todas as equipes')

    await expect(chip).toBeInTheDocument()
    await expect(chip.querySelector('[aria-hidden]')).toBeNull()
  },
}
