import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { PersonCardEmptySlot } from './PersonCardEmptySlot'

const meta = {
  title: 'UI/PersonCardEmptySlot',
  component: PersonCardEmptySlot,
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
} satisfies Meta<typeof PersonCardEmptySlot>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    teamName: 'Acolhida',
  },
}

export const Clickable: Story = {
  args: {
    teamName: 'Liturgia',
    onClick: fn(),
  },
}
