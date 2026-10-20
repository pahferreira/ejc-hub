import type { Meta, StoryObj } from '@storybook/react-vite'
import { FiMapPin } from 'react-icons/fi'
import { EventBannerInfoItem } from './EventBannerInfoItem'

const meta = {
  title: 'UI/EventBannerInfoItem',
  component: EventBannerInfoItem,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm bg-gradient-to-br from-dark-brown to-primary p-6 text-white">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof EventBannerInfoItem>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    icon: FiMapPin,
    label: 'Local',
    value: 'Casa de Retiro São José',
  },
}

export const LongValue: Story = {
  args: {
    icon: FiMapPin,
    label: 'Local',
    value:
      'Casa de Retiro São José - Rodovia Dom Gabriel Paulino Bueno Couto, km 72, Itatiba, São Paulo',
  },
}
