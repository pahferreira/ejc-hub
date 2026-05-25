import type { Meta, StoryObj } from '@storybook/react-vite'
import { SubscriptionSummaryBox } from './SubscriptionSummaryBox'

const meta = {
  title: 'UI/SubscriptionSummaryBox',
  component: SubscriptionSummaryBox,
  tags: ['autodocs'],
} satisfies Meta<typeof SubscriptionSummaryBox>

export const Completed = {
  args: {
    title: 'Concluído',
    value: 2,
    variant: 'completed',
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

export const Received = {
  args: {
    title: 'Recebido',
    value: 3,
    variant: 'received',
    description: 'Inscrições recebidas',
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

export const ClickableInactive = {
  args: {
    title: 'Pendente',
    value: 3,
    variant: 'pending',
    description: 'Aguardando revisão',
    onClick: () => {},
    active: false,
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export const ClickableActive = {
  args: {
    title: 'Pendente',
    value: 3,
    variant: 'pending',
    description: 'Aguardando revisão',
    onClick: () => {},
    active: true,
  },
} satisfies StoryObj<typeof SubscriptionSummaryBox>

export default meta
