import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { TeamAttendanceSection } from './TeamAttendanceSection'
import type { CoordinatorAttendanceReadModel } from '../../services/attendance/attendance.types'

const model: CoordinatorAttendanceReadModel = {
  teamInstanceId: 'team-1',
  teamAverage: { present: 106, eligible: 111, justified: 4, percentage: 95, band: 'good' },
  meetingCount: 2,
  totalRows: 115,
  justifiedTotal: 4,
  bandCounts: {
    good: 10,
    risky: 1,
    'needs-replacement': 0,
    'insufficient-data': 1,
    'no-meetings': 0,
  },
  roster: [],
  meetings: [
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
      heldOn: '2026-10-07',
      title: null,
      description: null,
      edited: false,
      rate: { present: 13, eligible: 13, justified: 0, percentage: 100, band: 'good' },
      attendances: [],
    },
  ],
}

const meta = {
  title: 'Attendance/TeamAttendanceSection',
  component: TeamAttendanceSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TeamAttendanceSection>

export default meta
type Story = StoryObj<typeof meta>

export const WithMeetings: Story = {
  args: { model },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Justificadas')).toBeInTheDocument()
    await expect(canvas.getByText('de 115 · 3%')).toBeInTheDocument()
    await expect(canvas.getByText('95%')).toBeInTheDocument()
    await expect(canvas.getByText('Editada')).toBeInTheDocument()
    // Read-only: no Registrar reunião, no click-to-edit rows.
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },
}

export const NoMeetings: Story = {
  args: {
    model: {
      ...model,
      teamAverage: { present: 0, eligible: 0, justified: 0, percentage: null, band: 'no-meetings' },
      meetingCount: 0,
      totalRows: 0,
      justifiedTotal: 0,
      meetings: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Nenhuma reunião registrada ainda.')).toBeInTheDocument()
    await expect(canvas.getByText('Nenhuma reunião registrada')).toBeInTheDocument()
    await expect(canvas.getByText('de 0 · 0%')).toBeInTheDocument()
  },
}
