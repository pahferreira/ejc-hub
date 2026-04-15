import type { Meta, StoryObj } from '@storybook/react-vite'
import { SubscriptionSummaryBox } from './SubscriptionSummaryBox'

const meta = {
  title: 'UI/SubscriptionSummaryBox',
  component: SubscriptionSummaryBox,
  tags: ['autodocs'],
} satisfies Meta<typeof SubscriptionSummaryBox>

export const Approved = {
  args: {
    title: 'Concluído',
    value: 2,
    variant: 'approved',
    description: 'Pessoas alocadas',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export const Pending = {
  args: {
    title: 'Pendente',
    value: 1,
    variant: 'pending',
    description: 'Aguardando revisão',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export const Waitlist = {
  args: {
    title: 'Lista de Espera',
    value: 1,
    variant: 'waitlist',
    description: 'Em espera',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export const Total = {
  args: {
    title: 'Total',
    value: 5,
    variant: 'total',
    description: 'Todas as inscrições',
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export default meta
