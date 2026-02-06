import type { Meta, StoryObj } from '@storybook/react'
import { ActionCard } from './ActionCard'
import { FiCalendar, FiUsers, FiFileText } from 'react-icons/fi'
import { withRouter } from 'storybook-addon-remix-react-router'

const meta = {
  title: 'Components/ActionCard',
  component: ActionCard,
  decorators: [withRouter],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ActionCard>

export default meta
type Story = StoryObj<typeof meta>

export const WithLink: Story = {
  args: {
    icon: <FiCalendar size={20} />,
    title: 'Gerenciar Eventos',
    description: 'Crie e gerencie os eventos do EJC',
    to: '/events',
  },
}

export const WithOnClick: Story = {
  args: {
    icon: <FiUsers size={20} />,
    title: 'Gerenciar Equipes',
    description: 'Configure templates e instâncias de equipes',
    onClick: () => alert('Clicked!'),
  },
}

export const LongDescription: Story = {
  args: {
    icon: <FiFileText size={20} />,
    title: 'Listar Inscrições',
    description:
      'Visualize todas as inscrições realizadas para o evento atual e gerencie os participantes',
    to: '/subscriptions',
  },
}
