import type { Meta, StoryObj } from '@storybook/react-vite'
import { SubscriptionSummaryBox } from './SubscriptionSummaryBox'

const meta = {
  title: 'UI/SubscriptionSummaryBox',
  component: SubscriptionSummaryBox,
  tags: ['autodocs'],
} satisfies Meta<typeof SubscriptionSummaryBox>

export const Total = {
  args: {
    title: 'Total Subscriptions',
    value: '3',
    variant: 'total',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export const Pending = {
  args: {
    title: 'Pending Review',
    value: '2',
    variant: 'pending',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export const Approved = {
  args: {
    title: 'Approved',
    value: '1',
    variant: 'approved',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export default meta
