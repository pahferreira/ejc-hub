import type { Meta, StoryObj } from '@storybook/react-vite'
import { RateSummary } from './RateSummary'

const meta = {
  title: 'UI/AttendanceRate/RateSummary',
  component: RateSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RateSummary>

export default meta
type Story = StoryObj<typeof meta>

export const GoodWithJustified: Story = {
  args: {
    label: 'Presença',
    rate: { present: 7, eligible: 9, justified: 2, percentage: 78, band: 'good' },
  },
}

export const Risky: Story = {
  args: {
    label: 'Presença',
    rate: { present: 6, eligible: 10, justified: 0, percentage: 60, band: 'risky' },
  },
}

export const NeedsReplacement: Story = {
  args: {
    label: 'Presença',
    rate: { present: 2, eligible: 8, justified: 1, percentage: 25, band: 'needs-replacement' },
  },
}

export const InsufficientData: Story = {
  args: {
    label: 'Presença',
    rate: { present: 1, eligible: 1, justified: 0, percentage: 100, band: 'insufficient-data' },
  },
}

export const NoMeetings: Story = {
  args: {
    label: 'Presença',
    rate: { present: 0, eligible: 0, justified: 0, percentage: null, band: 'no-meetings' },
  },
}
