import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
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
      teams: [
        { teamInstanceId: 't1', teamName: 'Liturgia', teamKey: 'liturgia', colorToken: 'violet' },
        { teamInstanceId: 't2', teamName: 'Música', teamKey: 'musica', colorToken: 'sky' },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('1h15')).toBeInTheDocument()
    await expect(canvas.getByText('Administração')).toBeInTheDocument()
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
      teams: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('23:00')).toBeInTheDocument()
    await expect(canvas.getByText('00:30')).toBeInTheDocument()
  },
}
