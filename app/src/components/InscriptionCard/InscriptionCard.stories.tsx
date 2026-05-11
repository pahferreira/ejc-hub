import type { Meta, StoryObj } from '@storybook/react-vite'
import { InscriptionCard } from './InscriptionCard'

const meta = {
  title: 'UI/InscriptionCard',
  component: InscriptionCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InscriptionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Approved: Story = {
  args: {
    subscriptionStatus: 'completed',
    paymentStatus: 'paid',
    shirtStatus: 'paid',
    meetingAttendance: { attended: 3, total: 3 },
    spiritualityAttendance: { attended: 3, total: 5 },
  },
}

export const ApprovedPartialAttendance: Story = {
  args: {
    subscriptionStatus: 'completed',
    paymentStatus: 'paid',
    shirtStatus: 'paid',
    meetingAttendance: { attended: 4, total: 5 },
    spiritualityAttendance: { attended: 3, total: 5 },
  },
}

export const WaitingList: Story = {
  args: {
    subscriptionStatus: 'waiting_list',
    paymentStatus: 'pending',
    shirtStatus: 'not_requested',
    meetingAttendance: { attended: 2, total: 5 },
    spiritualityAttendance: { attended: 1, total: 5 },
  },
}

export const Pending: Story = {
  args: {
    subscriptionStatus: 'pending',
  },
}

export const Received: Story = {
  args: {
    subscriptionStatus: 'received',
    paymentStatus: 'pending',
    shirtStatus: 'not_requested',
  },
}

export const StatusOnly: Story = {
  args: {
    subscriptionStatus: 'completed',
  },
}

export const NoAttendance: Story = {
  args: {
    subscriptionStatus: 'completed',
    paymentStatus: 'paid',
    shirtStatus: 'paid',
  },
}
