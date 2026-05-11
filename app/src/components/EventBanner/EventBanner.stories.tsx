import type { Meta, StoryObj } from '@storybook/react-vite'
import { EventBanner } from './EventBanner'

const meta = {
  title: 'UI/EventBanner',
  component: EventBanner,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof EventBanner>

export default meta
type Story = StoryObj<typeof meta>

export const FullData: Story = {
  args: {
    name: 'EJC Rosário 2026',
    description: 'Renascer em Cristo',
    startsAt: '2026-08-15T19:00:00.000Z',
    endsAt: '2026-08-17T18:00:00.000Z',
    location: 'Casa de Retiro São José - Itatiba/SP',
  },
}

export const SameDay: Story = {
  args: {
    name: 'Encontro de Casais',
    description: 'Um dia de renovação',
    startsAt: '2026-09-10T09:00:00.000Z',
    endsAt: '2026-09-10T18:00:00.000Z',
    location: 'Paróquia Nossa Senhora do Rosário',
  },
}

export const CrossMonth: Story = {
  args: {
    name: 'EJC Rosário 2026',
    description: 'Renascer em Cristo',
    startsAt: '2026-08-29T19:00:00.000Z',
    endsAt: '2026-09-02T18:00:00.000Z',
    location: 'Casa de Retiro São José - Itatiba/SP',
  },
}

export const CrossYear: Story = {
  args: {
    name: 'Retiro de Ano Novo',
    description: 'Começar 2027 com Cristo',
    startsAt: '2026-12-30T19:00:00.000Z',
    endsAt: '2027-01-02T18:00:00.000Z',
    location: 'Casa de Retiro São José - Itatiba/SP',
  },
}

export const NoDates: Story = {
  args: {
    name: 'EJC Rosário 2026',
    description: 'Renascer em Cristo',
    startsAt: null,
    endsAt: null,
    location: 'Casa de Retiro São José - Itatiba/SP',
  },
}

export const NoLocation: Story = {
  args: {
    name: 'EJC Rosário 2026',
    description: 'Renascer em Cristo',
    startsAt: '2026-08-15T19:00:00.000Z',
    endsAt: '2026-08-17T18:00:00.000Z',
    location: null,
  },
}

export const Minimal: Story = {
  args: {
    name: 'EJC Rosário 2026',
    description: 'Renascer em Cristo',
    startsAt: null,
    endsAt: null,
    location: null,
  },
}

export const LongContent: Story = {
  args: {
    name: 'Encontro de Jovens com Cristo Rosário Edição 2026',
    description: 'Um tempo para se reconectar e renovar a fé em comunidade',
    startsAt: '2026-08-15T19:00:00.000Z',
    endsAt: '2026-08-17T18:00:00.000Z',
    location: 'Casa de Retiro São José - Itatiba, São Paulo',
  },
}
