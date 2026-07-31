import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamDetailHeaderCard } from './TeamDetailHeaderCard'

const meta = {
  title: 'UI/TeamDetailHeaderCard',
  component: TeamDetailHeaderCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TeamDetailHeaderCard>

export default meta
type Story = StoryObj<typeof meta>

export const FullTeam: Story = {
  args: {
    name: 'Acolhida',
    description: 'Recebe os participantes com acolhimento e atenção.',
    memberCount: 11,
    maxCapacity: 12,
    freeSlots: 1,
    filledPercentage: 92,
  },
}

export const NearEmptyTeam: Story = {
  args: {
    name: 'Cozinha',
    description: 'Prepara e organiza as refeições do evento.',
    memberCount: 2,
    maxCapacity: 10,
    freeSlots: 8,
    filledPercentage: 20,
  },
}

export const NoDescription: Story = {
  args: {
    name: 'Comunicação',
    memberCount: 6,
    maxCapacity: 8,
    freeSlots: 2,
    filledPercentage: 75,
  },
}
