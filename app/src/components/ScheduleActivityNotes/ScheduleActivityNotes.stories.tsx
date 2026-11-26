import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ScheduleActivityNotes } from './ScheduleActivityNotes'

const meta = {
  title: 'Schedule/ScheduleActivityNotes',
  component: ScheduleActivityNotes,
  args: { notes: [] },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleActivityNotes>

export default meta
type Story = StoryObj<typeof meta>

/** No notes the viewer may read: nothing renders. */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByRole('list', { name: 'Notas' })).not.toBeInTheDocument()
  },
}

/** One coordinator's note, with its author, role and São Paulo time. */
export const OneNote: Story = {
  args: {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Levar os violões para o salão antes das 18h.')).toBeVisible()
    await expect(canvas.getByText('Ana (coordenação) · 14:32')).toBeVisible()
  },
}

/** Notes from different roles stack in the order they were left. */
export const SeveralNotes: Story = {
  args: {
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
        body: 'Começar com 5 minutos de atraso: o padre ainda está a caminho.',
        authorName: 'Bruno',
        authorRole: 'admin',
        createdAt: '2026-04-03T17:40:00Z',
      },
      {
        id: 'note-3',
        body: 'Microfone sem fio já está na mesa.',
        authorName: 'Carla',
        authorRole: 'coordinator',
        createdAt: '2026-04-03T17:51:00Z',
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const items = within(canvas.getByRole('list', { name: 'Notas' })).getAllByRole('listitem')

    await expect(items).toHaveLength(3)
    await expect(items[0]).toHaveTextContent('Ana (coordenação) · 14:32')
    await expect(items[1]).toHaveTextContent('Bruno (administração) · 14:40')
    await expect(items[2]).toHaveTextContent('Carla (coordenação) · 14:51')
  },
}
