import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { fn } from 'storybook/internal/test'
import { Selector, type Option } from './Selector'

const meta = {
  title: 'UI/Selector',
  component: Selector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Selector>

export default meta
type Story = StoryObj<typeof meta>

const sampleOptions: Option[] = [
  { label: 'Pending', value: 'pending' },
  { label: 'Received', value: 'received' },
  { label: 'Completed', value: 'completed' },
  { label: 'Waiting List', value: 'waiting_list' },
]

const SelectorWrapper = (args: any) => {
  const [selected, setSelected] = useState<Option | null>(args.selected || null)

  return (
    <div style={{ width: '320px' }}>
      <Selector {...args} selected={selected} onChange={setSelected} />
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <strong>Selected:</strong> {selected ? selected.label : 'None'}
      </div>
    </div>
  )
}

export const Default: Story = {
  render: (args) => <SelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    placeholder: 'Select a status...',
    onChange: fn(),
  },
}

export const WithLabel: Story = {
  render: (args) => <SelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    label: 'Status',
    placeholder: 'Select a status...',
    onChange: fn(),
  },
}

export const WithPreselected: Story = {
  render: (args) => <SelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    selected: sampleOptions[0],
    label: 'Status',
    onChange: fn(),
  },
}

export const Disabled: Story = {
  render: (args) => <SelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    selected: sampleOptions[1],
    label: 'Status (Disabled)',
    disabled: true,
    onChange: fn(),
  },
}
