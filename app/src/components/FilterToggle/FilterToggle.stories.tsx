import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FilterToggle, type FilterToggleOption } from './FilterToggle'

const options: FilterToggleOption[] = [
  { value: 'all', label: 'Todas' },
  { value: 'available', label: 'Com vagas' },
  { value: 'full', label: 'Cheias' },
]

const meta = {
  title: 'UI/FilterToggle',
  component: FilterToggle,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    options,
    onChange: fn(),
  },
} satisfies Meta<typeof FilterToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    value: 'all',
  },
}

export const SecondActive: Story = {
  args: {
    value: 'available',
  },
}

export const ManyOptions: Story = {
  args: {
    value: 'pending',
    options: [
      { value: 'all', label: 'Todas' },
      { value: 'pending', label: 'Pendentes' },
      { value: 'received', label: 'Recebidas' },
      { value: 'completed', label: 'Concluídas' },
      { value: 'waiting_list', label: 'Lista de espera' },
    ],
  },
}

export const Interactive: Story = {
  args: {
    value: 'all',
  },
  render: () => {
    const [value, setValue] = useState('all')

    return (
      <div className="flex flex-col gap-4">
        <FilterToggle
          options={options}
          value={value}
          onChange={setValue}
          ariaLabel="Filtrar equipes"
        />
        <pre className="rounded-md bg-tertiary-background p-3 text-xs text-dark-brown">
          {JSON.stringify({ value }, null, 2)}
        </pre>
      </div>
    )
  },
}
