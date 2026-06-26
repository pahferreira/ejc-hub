import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamBuildingCard } from './TeamBuildingCard'

const meta = {
  title: 'UI/TeamBuildingCard',
  component: TeamBuildingCard,
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
} satisfies Meta<typeof TeamBuildingCard>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {
  args: {
    name: 'Alice Ribeiro',
    nickname: 'Lili',
    badge: 'Encontrista',
    phone: '(41) 90427-7888',
    attributes: ['Música', 'Teatro'],
    preferences: ['Logística', 'Primeira Eucaristia', 'Decoração'],
  },
}

export const WithoutPreferences: Story = {
  args: {
    name: 'Bruno Carvalho',
    nickname: 'Bru',
    badge: 'Encontreiro Rosário',
    phone: '(41) 91234-5678',
    attributes: ['Cozinha'],
  },
}

export const NoBadgeSingleWordName: Story = {
  args: {
    name: 'Madonna',
    nickname: 'Madge',
    phone: '(41) 99999-0000',
    attributes: ['Música', 'Liturgia'],
    preferences: ['Decoração'],
  },
}

export const WithAvatarImage: Story = {
  args: {
    name: 'Alice Ribeiro',
    nickname: 'Lili',
    badge: 'Encontreiro',
    phone: '(41) 90427-7888',
    avatarUrl: 'https://i.pravatar.cc/80?img=5',
    attributes: ['Música', 'Teatro'],
    preferences: ['Logística', 'Decoração'],
  },
}

export const Minimal: Story = {
  args: {
    name: 'Carla Souza',
    nickname: 'Carlinha',
  },
}
