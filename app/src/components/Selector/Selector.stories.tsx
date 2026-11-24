import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
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

const SelectorWrapper = (args: React.ComponentProps<typeof Selector>) => {
  const [selected, setSelected] = useState<Option | undefined>(args.selected)

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

// A short `overflow-auto` box with the field at its bottom, like a selector at
// the end of `main` or a Drawer body (#371). The list has to escape the box.
export const InsideScrollContainer: Story = {
  render: (args) => (
    <div style={{ height: '120px', overflow: 'auto' }}>
      <div style={{ paddingTop: '40px' }}>
        <SelectorWrapper {...args} />
      </div>
    </div>
  ),
  args: {
    options: sampleOptions,
    placeholder: 'Select a status...',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(screen.getByRole('button', { name: /select a status/i }))

    const listbox = await screen.findByRole('listbox')
    const rect = listbox.getBoundingClientRect()
    const bottomEdge = canvasElement.ownerDocument.elementFromPoint(
      rect.left + rect.width / 2,
      rect.bottom - 4
    )
    await expect(listbox.contains(bottomEdge)).toBe(true)
  },
}
