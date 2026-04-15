import type { Meta, StoryObj } from '@storybook/react'
import { StatusCard } from './StatusCard'

const meta = {
  title: 'UI/StatusCard',
  component: StatusCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatusCard>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {
  args: {
    title: 'Total de Membros nas Equipes',
    value: 27,
    variant: 'neutral',
    description: 'inscrições aprovadas + coordenadores',
  },
}

export const Success: Story = {
  args: {
    title: 'Taxas Pagas',
    value: 22,
    variant: 'success',
    description: '81% do total',
  },
}

export const Error: Story = {
  args: {
    title: 'Taxas Pendentes',
    value: 5,
    variant: 'error',
    description: '19% do total',
  },
}

export const Info: Story = {
  args: {
    title: 'Taxa de Pagamento Global',
    value: '81%',
    variant: 'info',
    description: '22 de 27 membros',
  },
}
