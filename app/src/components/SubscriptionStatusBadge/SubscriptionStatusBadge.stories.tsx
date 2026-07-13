import type { Meta, StoryObj } from '@storybook/react-vite'
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge'

const meta = {
  title: 'UI/SubscriptionStatusBadge',
  component: SubscriptionStatusBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof SubscriptionStatusBadge>

export default meta

export const Pending: StoryObj<typeof SubscriptionStatusBadge> = {
  args: {
    status: 'pending',
  },
}

export const Received: StoryObj<typeof SubscriptionStatusBadge> = {
  args: {
    status: 'received',
  },
}

export const Completed: StoryObj<typeof SubscriptionStatusBadge> = {
  args: {
    status: 'completed',
  },
}

export const WaitingList: StoryObj<typeof SubscriptionStatusBadge> = {
  args: {
    status: 'waiting_list',
  },
}
