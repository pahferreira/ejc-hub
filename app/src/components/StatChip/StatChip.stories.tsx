import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatChip } from './StatChip'

const meta = {
  title: 'UI/StatChip',
  component: StatChip,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatChip>

export default meta
type Story = StoryObj<typeof meta>

export const Assigned: Story = {
  args: {
    label: 'Atribuídos',
    value: 114,
  },
}

export const Waiting: Story = {
  args: {
    label: 'Aguardando',
    value: 4,
    variant: 'waiting',
  },
}
