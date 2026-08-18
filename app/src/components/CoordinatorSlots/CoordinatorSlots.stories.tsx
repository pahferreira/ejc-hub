import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CoordinatorSlots } from './CoordinatorSlots'

const meta = {
  title: 'UI/CoordinatorSlots',
  component: CoordinatorSlots,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onRemove: fn(),
    maxSlots: 3,
  },
} satisfies Meta<typeof CoordinatorSlots>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    selected: [],
  },
}

export const OneSlotFilled: Story = {
  args: {
    selected: [{ id: '1', name: 'João da Silva', nickname: 'Joãozinho' }],
  },
}

export const TwoSlotsFilled: Story = {
  args: {
    selected: [
      { id: '1', name: 'João da Silva', nickname: 'Joãozinho' },
      { id: '2', name: 'Maria Santos', nickname: 'Mari' },
    ],
  },
}

export const ThreeSlotsFilled: Story = {
  args: {
    selected: [
      { id: '1', name: 'João da Silva', nickname: 'Joãozinho' },
      { id: '2', name: 'Maria Santos', nickname: 'Mari' },
      { id: '3', name: 'Pedro Oliveira', nickname: 'Pedrinho' },
    ],
  },
}

export const WithPhoto: Story = {
  args: {
    selected: [
      {
        id: '1',
        name: 'João da Silva',
        nickname: 'Joãozinho',
        pictureUrl: 'https://i.pravatar.cc/80?img=5',
      },
      { id: '2', name: 'Maria Santos', nickname: 'Mari' },
    ],
  },
}

export const MaxOneSlot: Story = {
  args: {
    maxSlots: 1,
    selected: [],
  },
}

export const MaxFourSlots: Story = {
  args: {
    maxSlots: 4,
    selected: [
      { id: '1', name: 'João da Silva', nickname: 'Joãozinho' },
      { id: '2', name: 'Maria Santos', nickname: 'Mari' },
    ],
  },
}

export const MaxSixSlotsWrapping: Story = {
  args: {
    maxSlots: 6,
    selected: [
      { id: '1', name: 'João da Silva', nickname: 'Joãozinho' },
      { id: '2', name: 'Maria Santos', nickname: 'Mari' },
      { id: '3', name: 'Pedro Oliveira', nickname: 'Pedrinho' },
    ],
  },
}
