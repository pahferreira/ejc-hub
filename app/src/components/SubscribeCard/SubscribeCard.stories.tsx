import type { Meta, StoryObj } from '@storybook/react-vite'
import { SubscribeCard } from './SubscribeCard'

const meta = {
  title: 'UI/SubscribeCard',
  component: SubscribeCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SubscribeCard>

export default meta
type Story = StoryObj<typeof meta>

export const LongEventName: Story = {
  args: {
    eventName: 'Encontro de Jovens com Cristo Rosário Edição 2026',
    onSubscribe: () => alert('Subscribe clicked'),
  },
}
