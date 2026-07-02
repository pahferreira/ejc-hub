import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { CoordinatorCandidateRow } from './CoordinatorCandidateRow'

const meta = {
  title: 'UI/CoordinatorCandidateRow',
  component: CoordinatorCandidateRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onToggle: fn(),
    name: 'João da Silva',
    nickname: 'Joãozinho',
    experienceType: 'newbie',
    areas: ['Música', 'Teatro'],
    teams: ['Liturgia', 'Cozinha'],
    preferredThisTeam: false,
    selected: false,
    disabled: false,
  },
} satisfies Meta<typeof CoordinatorCandidateRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Selected: Story = {
  args: {
    selected: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const SelectedAndPreferred: Story = {
  args: {
    selected: true,
    preferredThisTeam: true,
  },
}

export const ExperiencedWithPreference: Story = {
  args: {
    name: 'Maria Santos',
    nickname: 'Mari',
    experienceType: 'experienced',
    areas: ['Louvor', 'Oração'],
    preferredThisTeam: true,
  },
}

export const ExperiencedOutsider: Story = {
  args: {
    name: 'Pedro Oliveira',
    nickname: 'Pedrinho',
    experienceType: 'experienced_outsider',
    areas: [],
    preferredThisTeam: false,
  },
}

export const NoAreas: Story = {
  args: {
    areas: [],
  },
}
