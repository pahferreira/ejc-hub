import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamCard } from './TeamCard'

const meta = {
  title: 'UI/TeamCard',
  component: TeamCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TeamCard>

export default meta
type Story = StoryObj<typeof meta>

export const Assigned: Story = {
  args: {
    variant: 'assigned',
    team: {
      id: 'team-1',
      name: 'Liturgia',
      description: 'Prepara e conduz momentos de oração e celebrações.',
      coordinators: [
        { id: 'u1', name: 'Maria Silva', phone: '(11) 98765-4321' },
        { id: 'u2', name: 'João Santos', phone: '(11) 91234-5678' },
      ],
    },
  },
}

export const AssignedWithoutDescription: Story = {
  args: {
    variant: 'assigned',
    team: {
      id: 'team-2',
      name: 'Cozinha',
      description: null,
      coordinators: [{ id: 'u3', name: 'Ana Souza', phone: null }],
    },
  },
}

export const AssignedNoCoordinators: Story = {
  args: {
    variant: 'assigned',
    team: {
      id: 'team-3',
      name: 'Recepção',
      description: 'Acolhe os participantes na chegada.',
      coordinators: [],
    },
  },
}

export const Pending: Story = {
  args: {
    variant: 'pending',
    preferences: [
      { key: 'music', name: 'Musica' },
      { key: 'liturgy', name: 'Liturgia' },
    ],
  },
}

export const PendingNoPreferences: Story = {
  args: {
    variant: 'pending',
    preferences: [],
  },
}

export const WaitingList: Story = {
  args: {
    variant: 'waitingList',
    preferences: [
      { key: 'music', name: 'Musica' },
      { key: 'liturgy', name: 'Liturgia' },
    ],
  },
}

export const WaitingListNoPreferences: Story = {
  args: {
    variant: 'waitingList',
    preferences: [],
  },
}
