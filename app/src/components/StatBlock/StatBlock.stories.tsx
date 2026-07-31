import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatBlock } from './StatBlock'

const meta = {
  title: 'UI/StatBlock',
  component: StatBlock,
  tags: ['autodocs'],
} satisfies Meta<typeof StatBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Membros: Story = {
  args: {
    value: 24,
    label: 'Membros',
  },
}

export const Capacidade: Story = {
  args: {
    value: 30,
    label: 'Capacidade',
  },
}

export const VagasLivres: Story = {
  args: {
    value: 6,
    label: 'Vagas livres',
  },
}

export const Row: Story = {
  args: {
    value: 24,
    label: 'Membros',
  },
  render: () => (
    <div className="flex gap-8">
      <StatBlock value={24} label="Membros" />
      <StatBlock value={30} label="Capacidade" />
      <StatBlock value={6} label="Vagas livres" />
    </div>
  ),
}
