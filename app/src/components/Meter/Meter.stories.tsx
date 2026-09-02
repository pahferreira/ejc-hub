import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Meter } from './Meter'

const meta = {
  title: 'UI/Meter',
  component: Meter,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Meter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    percentage: 74,
    label: 'Pagamento geral',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar', { name: 'Pagamento geral' })

    await expect(bar).toHaveAttribute('aria-valuenow', '74')
  },
}

export const Tones: Story = {
  args: {
    percentage: 100,
    label: 'Completo',
  },
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Meter percentage={100} tone="success" label="Completo" />
      <Meter percentage={67} tone="warning" label="Parcial" />
      <Meter percentage={43} tone="error" label="Baixo" />
      <Meter percentage={0} tone="default" label="Sem membros" />
    </div>
  ),
}

export const ClampsOutOfRangeValues: Story = {
  args: {
    percentage: 140,
    label: 'Acima do máximo',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const bar = canvas.getByRole('progressbar', { name: 'Acima do máximo' })

    await expect(bar).toHaveAttribute('aria-valuenow', '100')
  },
}
