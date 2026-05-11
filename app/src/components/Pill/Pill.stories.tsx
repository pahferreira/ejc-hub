import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pill } from './Pill'

const meta = {
  title: 'UI/Pill',
  component: Pill,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Pill>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: 'Musica',
  },
}

export const ShortLabel: Story = {
  args: {
    children: 'OK',
  },
}

export const LongLabel: Story = {
  args: {
    children: 'Coordenação geral do evento',
  },
}

export const Group: Story = {
  args: {
    children: '',
  },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Pill>Musica</Pill>
      <Pill>Liturgia</Pill>
      <Pill>Cozinha</Pill>
      <Pill>Recepção</Pill>
    </div>
  ),
}
