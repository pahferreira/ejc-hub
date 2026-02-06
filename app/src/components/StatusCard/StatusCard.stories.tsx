import type { Meta, StoryObj } from '@storybook/react'
import { StatusCard } from './StatusCard'
import { reactRouterParameters, withRouter } from 'storybook-addon-remix-react-router'

const meta = {
  title: 'Components/StatusCard',
  component: StatusCard,
  decorators: [withRouter],
  parameters: {
    layout: 'padded',
    reactRouterParameters: reactRouterParameters({
      location: {
        pathParams: {},
      },
      routing: { path: '/subscriptions/new' },
    }),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Subscribed: Story = {
  args: {
    title: 'Inscrição Confirmada',
    variant: 'success',
    description: 'Você já está inscrito no EJC 2024. Sua inscrição foi confirmada!',
  },
}

export const NotSubscribed: Story = {
  args: {
    title: 'Inscrição Pendente',
    variant: 'warning',
    description: 'Você ainda não se inscreveu no próximo encontro. Não perca essa oportunidade!',
    action: {
      label: 'Fazer Inscrição',
      to: '/subscriptions/new',
    },
  },
}

export const WithAction: Story = {
  args: {
    title: 'Status do Evento',
    variant: 'info',
    description: 'O evento está acontecendo agora.',
    action: {
      label: 'Ver Detalhes',
      onClick: () => alert('Ver detalhes'),
    },
  },
}

export const Neutral: Story = {
  args: {
    title: 'Próximo Evento',
    variant: 'neutral',
    description: 'As inscrições ainda não foram abertas.',
  },
}
