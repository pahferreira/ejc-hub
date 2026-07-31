import type { Meta, StoryObj } from '@storybook/react-vite'
import { WeekAvailability } from './WeekAvailability'

const meta = {
  title: 'UI/WeekAvailability',
  component: WeekAvailability,
  tags: ['autodocs'],
} satisfies Meta<typeof WeekAvailability>

export default meta
type Story = StoryObj<typeof meta>

export const FullWeek: Story = {
  args: {
    weekAvailability: [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ],
  },
}

export const Partial: Story = {
  args: {
    weekAvailability: ['monday', 'wednesday', 'friday'],
  },
}

export const Empty: Story = {
  args: {
    weekAvailability: [],
  },
}
