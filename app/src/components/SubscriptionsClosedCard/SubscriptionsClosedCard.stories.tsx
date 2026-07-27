import type { Meta, StoryObj } from '@storybook/react-vite'
import { SubscriptionsClosedCard } from './SubscriptionsClosedCard'

const meta = {
  title: 'UI/SubscriptionsClosedCard',
  component: SubscriptionsClosedCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SubscriptionsClosedCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    eventName: 'EJC Rosário 2026',
  },
}

export const LongEventName: Story = {
  args: {
    eventName: 'Encontro de Jovens com Cristo Rosário Edição 2026',
  },
}
