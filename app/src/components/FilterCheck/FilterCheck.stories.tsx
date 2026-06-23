import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { FilterCheck, type FilterCheckOption } from './FilterCheck'

const options: FilterCheckOption[] = [
  { value: 'new', label: 'Novo' },
  { value: 'veteran', label: 'Veterano' },
  { value: 'external_veteran', label: 'Veterano Externo' },
]

const meta = {
  title: 'UI/FilterCheck',
  component: FilterCheck,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    label: 'Exp.',
    options,
    onChange: fn(),
  },
} satisfies Meta<typeof FilterCheck>

export default meta
type Story = StoryObj<typeof meta>

export const NoneSelected: Story = {
  args: {
    value: [],
  },
}

export const OneSelected: Story = {
  args: {
    value: ['new'],
  },
}

export const MultipleSelected: Story = {
  args: {
    value: ['new', 'veteran'],
  },
}

export const Interactive: Story = {
  args: {
    value: [],
  },
  render: () => {
    const [value, setValue] = useState<string[]>([])

    return (
      <div className="flex flex-col gap-4">
        <FilterCheck
          label="Exp."
          options={options}
          value={value}
          onChange={setValue}
          ariaLabel="Filtrar por experiência"
        />
        <pre className="rounded-md bg-tertiary-background p-3 text-xs text-dark-brown">
          {JSON.stringify({ value }, null, 2)}
        </pre>
      </div>
    )
  },
}
