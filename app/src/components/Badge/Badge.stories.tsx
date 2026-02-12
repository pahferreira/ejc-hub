import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>

export default meta

export const Default: StoryObj<typeof Badge> = {
  args: {
    children: 'Default',
  },
}

export const Pending: StoryObj<typeof Badge> = {
  args: {
    children: 'Pending',
    variant: 'pending',
  },
}

export const Approved: StoryObj<typeof Badge> = {
  args: {
    children: 'Approved',
    variant: 'approved',
  },
}

export const Completed: StoryObj<typeof Badge> = {
  args: {
    children: 'Completed',
    variant: 'completed',
  },
}

export const WaitingList: StoryObj<typeof Badge> = {
  args: {
    children: 'Waiting List',
    variant: 'waiting_list',
  },
}
