import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamBuildingCard } from '../TeamBuildingCard/TeamBuildingCard'
import { TeamBuildingColumn } from './TeamBuildingColumn'

const meta = {
  title: 'UI/TeamBuildingColumn',
  component: TeamBuildingColumn,
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
} satisfies Meta<typeof TeamBuildingColumn>

export default meta
type Story = StoryObj<typeof meta>

const members = (
  <>
    <TeamBuildingCard
      name="Alice Ribeiro"
      phone="(41) 90427-7888"
      attributes={['Música', 'Teatro']}
    />
    <TeamBuildingCard name="Bruno Carvalho" phone="(41) 91234-5678" attributes={['Cozinha']} />
  </>
)

export const DefaultEmpty: Story = {
  args: {
    title: 'Liturgia',
    count: 0,
    max: 15,
    variant: 'default',
  },
}

export const DefaultPopulated: Story = {
  args: {
    title: 'Liturgia',
    count: 2,
    max: 15,
    variant: 'default',
    children: members,
  },
}

export const DashedEmpty: Story = {
  args: {
    title: 'Sem Equipe',
    description: 'Sem equipe nem lista de espera',
    count: 0,
    variant: 'dashed',
  },
}

export const DashedPopulated: Story = {
  args: {
    title: 'Sem Equipe',
    description: 'Sem equipe nem lista de espera',
    count: 2,
    variant: 'dashed',
    children: members,
  },
}

export const TransparentEmpty: Story = {
  args: {
    title: 'Lista de Espera',
    description: 'Membros aguardando alocação',
    count: 0,
    variant: 'transparent',
  },
}

export const TransparentPopulated: Story = {
  args: {
    title: 'Lista de Espera',
    description: 'Membros aguardando alocação',
    count: 2,
    variant: 'transparent',
    children: members,
  },
}
