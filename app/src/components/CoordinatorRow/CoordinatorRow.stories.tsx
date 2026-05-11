import type { Meta, StoryObj } from '@storybook/react-vite'
import { CoordinatorRow } from './CoordinatorRow'

const meta = {
  title: 'UI/CoordinatorRow',
  component: CoordinatorRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CoordinatorRow>

export default meta
type Story = StoryObj<typeof meta>

export const WithPhone: Story = {
  args: {
    name: 'Maria Silva',
    phone: '(11) 98765-4321',
  },
}

export const WithoutPhone: Story = {
  args: {
    name: 'João Santos',
    phone: null,
  },
}

export const LongName: Story = {
  args: {
    name: 'Maria Aparecida da Silva Rodrigues',
    phone: '(11) 91234-5678',
  },
}
