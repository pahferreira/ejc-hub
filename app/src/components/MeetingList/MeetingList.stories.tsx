import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within, fn } from 'storybook/test'
import { MeetingList } from './MeetingList'
import type { AttendanceMeeting } from '../../services/attendance/attendance.types'

const meetings: AttendanceMeeting[] = [
  {
    id: 'm1',
    heldOn: '2026-10-14',
    title: 'Ensaio geral',
    description: null,
    edited: true,
    rate: { present: 10, eligible: 14, justified: 2, percentage: 71, band: 'risky' },
    attendances: [],
  },
  {
    id: 'm2',
    heldOn: '2026-10-14',
    title: null,
    description: null,
    edited: false,
    rate: { present: 13, eligible: 13, justified: 0, percentage: 100, band: 'good' },
    attendances: [],
  },
  {
    id: 'm3',
    heldOn: '2026-10-07',
    title: 'Dinâmica de acolhida',
    description: null,
    edited: false,
    rate: { present: 6, eligible: 12, justified: 1, percentage: 50, band: 'risky' },
    attendances: [],
  },
]

const meta = {
  title: 'UI/MeetingList',
  component: MeetingList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MeetingList>

export default meta
type Story = StoryObj<typeof meta>

export const Coordinator: Story = {
  args: {
    meetings,
    onSelectMeeting: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // The untitled meeting falls back to the plain "Reunião" label.
    await expect(canvas.getByText('Reunião')).toBeInTheDocument()
    // The edited meeting carries the pill.
    await expect(canvas.getByText('editada')).toBeInTheDocument()
    // Clickable rows in coordinator mode.
    await expect(canvas.getAllByRole('button').length).toBe(meetings.length)
  },
}

export const ReadOnly: Story = {
  args: {
    meetings,
    readOnly: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // No chevron, no click target in read-only mode.
    await expect(canvas.queryAllByRole('button').length).toBe(0)
  },
}

export const Empty: Story = {
  args: {
    meetings: [],
    emptyMessage: <p className="text-sm text-dark-brown/60">Nenhuma reunião registrada.</p>,
  },
}
