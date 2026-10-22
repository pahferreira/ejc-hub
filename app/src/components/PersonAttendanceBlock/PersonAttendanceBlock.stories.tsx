import type { Meta, StoryObj } from '@storybook/react-vite'
import { PersonAttendanceBlock } from './PersonAttendanceBlock'

const meta = {
  title: 'UI/PersonAttendanceBlock',
  component: PersonAttendanceBlock,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Presença de Ju',
  },
} satisfies Meta<typeof PersonAttendanceBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Good: Story = {
  args: {
    rate: { present: 9, eligible: 9, justified: 0, percentage: 100, band: 'good' },
  },
}

export const WithJustified: Story = {
  args: {
    rate: { present: 7, eligible: 8, justified: 2, percentage: 88, band: 'good' },
  },
}

export const Risky: Story = {
  args: {
    rate: { present: 5, eligible: 8, justified: 1, percentage: 63, band: 'risky' },
  },
}

export const NeedsReplacement: Story = {
  args: {
    rate: { present: 2, eligible: 7, justified: 0, percentage: 29, band: 'needs-replacement' },
  },
}

export const InsufficientData: Story = {
  args: {
    rate: { present: 1, eligible: 1, justified: 0, percentage: 100, band: 'insufficient-data' },
  },
}

export const NoMeetings: Story = {
  args: {
    rate: { present: 0, eligible: 0, justified: 0, percentage: null, band: 'no-meetings' },
  },
}
