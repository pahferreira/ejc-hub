import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { MemberAttendanceHistory } from './MemberAttendanceHistory'
import type { MemberAttendanceReadModel } from '../../services/attendance/attendance.types'

const model: MemberAttendanceReadModel = {
  teamInstanceId: 'team-a',
  joinedAt: '2026-09-20T12:00:00Z',
  rate: { present: 4, eligible: 5, justified: 2, percentage: 80, band: 'good' },
  meetings: [
    {
      id: 'm1',
      heldOn: '2026-10-14',
      title: 'Ensaio geral',
      teamRate: { present: 12, eligible: 15, justified: 1, percentage: 80, band: 'good' },
      beforeJoin: false,
      status: 'present',
      justificationReason: null,
    },
    {
      id: 'm2',
      heldOn: '2026-10-07',
      title: null,
      teamRate: { present: 10, eligible: 14, justified: 2, percentage: 71, band: 'risky' },
      beforeJoin: false,
      status: 'justified',
      justificationReason: 'Plantão no hospital',
    },
    {
      id: 'm3',
      heldOn: '2026-09-30',
      title: 'Dinâmica de acolhida',
      teamRate: { present: 9, eligible: 15, justified: 0, percentage: 60, band: 'risky' },
      beforeJoin: false,
      status: 'absent',
      justificationReason: null,
    },
    {
      id: 'm4',
      heldOn: '2026-09-16',
      title: 'Primeira reunião',
      teamRate: { present: 11, eligible: 13, justified: 0, percentage: 85, band: 'good' },
      beforeJoin: true,
      status: null,
      justificationReason: null,
    },
  ],
}

const meta = {
  title: 'UI/MemberAttendanceHistory',
  component: MemberAttendanceHistory,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MemberAttendanceHistory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { model },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('4/5 · 80%')).toBeInTheDocument()
    await expect(canvas.getByText('Presente')).toBeInTheDocument()
    await expect(canvas.getByText('Ausente')).toBeInTheDocument()
    await expect(canvas.getByText('antes da sua entrada · não conta')).toBeInTheDocument()

    // The reason stays hidden until the link expands it, and collapses again.
    await expect(canvas.queryByText('Plantão no hospital')).not.toBeInTheDocument()
    const toggle = canvas.getByRole('button', { name: /Ver justificativa/ })
    await userEvent.click(toggle)
    await expect(canvas.getByText('Plantão no hospital')).toBeInTheDocument()
    await userEvent.click(toggle)
    await expect(canvas.queryByText('Plantão no hospital')).not.toBeInTheDocument()
  },
}

export const FewMeetings: Story = {
  args: {
    model: {
      ...model,
      rate: { present: 1, eligible: 1, justified: 0, percentage: 100, band: 'insufficient-data' },
      meetings: model.meetings.slice(0, 1),
    },
  },
}

export const NoMeetingsSinceJoining: Story = {
  args: {
    model: {
      ...model,
      rate: { present: 0, eligible: 0, justified: 0, percentage: null, band: 'no-meetings' },
      meetings: model.meetings.slice(3),
    },
  },
}

export const Empty: Story = {
  args: {
    model: {
      ...model,
      rate: { present: 0, eligible: 0, justified: 0, percentage: null, band: 'no-meetings' },
      meetings: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Sem reuniões desde a entrada')).toBeInTheDocument()
  },
}
