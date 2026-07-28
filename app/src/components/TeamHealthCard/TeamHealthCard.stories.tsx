import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { TeamHealthCard } from './TeamHealthCard'

const meta = {
  title: 'UI/TeamHealthCard',
  component: TeamHealthCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onAdd: fn(),
    onAssignCoordinator: fn(),
  },
} satisfies Meta<typeof TeamHealthCard>

export default meta
type Story = StoryObj<typeof meta>

export const NeedsMembers: Story = {
  args: {
    team: {
      id: 'team-acolhida',
      templateKey: 'acolhida',
      templateName: 'Acolhida',
      templateDescription: 'Recebe os participantes com acolhimento e atenção.',
      memberCount: 7,
      maxCapacity: 12,
      coordinators: [{ id: 'u1', name: 'Julia Martins', pictureUrl: null }],
    },
  },
}

export const HasSpotsAvailable: Story = {
  args: {
    team: {
      id: 'team-animacao',
      templateKey: 'animacao',
      templateName: 'Animação',
      templateDescription: 'Conduz dinâmicas e atividades de integração.',
      memberCount: 13,
      maxCapacity: 15,
      coordinators: [
        { id: 'u2', name: 'Carlos Ferreira', pictureUrl: 'https://i.pravatar.cc/80?img=12' },
      ],
    },
  },
}

export const Complete: Story = {
  args: {
    team: {
      id: 'team-liturgia',
      templateKey: 'liturgia',
      templateName: 'Liturgia',
      templateDescription: 'Prepara e conduz momentos de oração e celebrações.',
      memberCount: 12,
      maxCapacity: 12,
      coordinators: [{ id: 'u3', name: 'Maria Silva', pictureUrl: null }],
    },
  },
}

export const WithoutDescription: Story = {
  args: {
    team: {
      id: 'team-no-desc',
      templateKey: 'cozinha',
      templateName: 'Cozinha',
      templateDescription: null,
      memberCount: 6,
      maxCapacity: 10,
      coordinators: [{ id: 'u4', name: 'Ana Souza', pictureUrl: null }],
    },
  },
}

export const WithoutCoordinator: Story = {
  args: {
    team: {
      id: 'team-no-coord',
      templateKey: 'apoio',
      templateName: 'Apoio',
      templateDescription: 'Oferece suporte geral às demais equipes.',
      memberCount: 7,
      maxCapacity: 15,
      coordinators: [],
    },
  },
}

export const WithThreeCoordinators: Story = {
  args: {
    team: {
      id: 'team-three-coord',
      templateKey: 'comunicacao',
      templateName: 'Comunicação',
      templateDescription: 'Gerencia redes sociais e divulgação do evento.',
      memberCount: 8,
      maxCapacity: 10,
      coordinators: [
        { id: 'u5', name: 'Paula Lima', pictureUrl: 'https://i.pravatar.cc/80?img=25' },
        { id: 'u6', name: 'Rafael Costa', pictureUrl: null },
        { id: 'u7', name: 'Beatriz Almeida', pictureUrl: null },
      ],
    },
  },
}

export const Grid: Story = {
  args: {
    team: {
      id: 'team-grid-1',
      templateKey: 'acolhida',
      templateName: 'Acolhida',
      templateDescription: 'Recebe os participantes com acolhimento e atenção.',
      memberCount: 7,
      maxCapacity: 12,
      coordinators: [{ id: 'u1', name: 'Julia Martins', pictureUrl: null }],
    },
  },
  render: () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <TeamHealthCard
        team={{
          id: 'team-grid-needs',
          templateKey: 'acolhida',
          templateName: 'Acolhida',
          templateDescription: 'Recebe os participantes com acolhimento e atenção.',
          memberCount: 7,
          maxCapacity: 12,
          coordinators: [{ id: 'u1', name: 'Julia Martins', pictureUrl: null }],
        }}
        onAdd={fn()}
      />
      <TeamHealthCard
        team={{
          id: 'team-grid-spots',
          templateKey: 'animacao',
          templateName: 'Animação',
          templateDescription: 'Conduz dinâmicas e atividades de integração.',
          memberCount: 13,
          maxCapacity: 15,
          coordinators: [
            { id: 'u2', name: 'Carlos Ferreira', pictureUrl: 'https://i.pravatar.cc/80?img=12' },
          ],
        }}
        onAdd={fn()}
      />
      <TeamHealthCard
        team={{
          id: 'team-grid-complete',
          templateKey: 'liturgia',
          templateName: 'Liturgia',
          templateDescription: 'Prepara e conduz momentos de oração e celebrações.',
          memberCount: 12,
          maxCapacity: 12,
          coordinators: [{ id: 'u3', name: 'Maria Silva', pictureUrl: null }],
        }}
        onAdd={fn()}
      />
    </div>
  ),
}
