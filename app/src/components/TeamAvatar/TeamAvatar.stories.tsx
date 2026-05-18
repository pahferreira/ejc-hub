import type { Meta, StoryObj } from '@storybook/react-vite'
import { TeamAvatar } from './TeamAvatar'

const meta = {
  title: 'UI/TeamAvatar',
  component: TeamAvatar,
  tags: ['autodocs'],
} satisfies Meta<typeof TeamAvatar>

export default meta

export const SingleWord: StoryObj<typeof TeamAvatar> = {
  args: {
    name: 'Música',
  },
}

export const TwoWords: StoryObj<typeof TeamAvatar> = {
  args: {
    name: 'Coordenação Geral',
  },
}

export const LongName: StoryObj<typeof TeamAvatar> = {
  args: {
    name: 'Equipe de Liturgia e Acolhida',
  },
}
