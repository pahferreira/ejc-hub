import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn } from 'storybook/internal/test'
import { MultiSelector, type Option } from './MultiSelector'

const meta = {
  title: 'UI/MultiSelector',
  component: MultiSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MultiSelector>

export default meta
type Story = StoryObj<typeof meta>

const sampleOptions: Option[] = [
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Angular', value: 'angular' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Solid', value: 'solid' },
]

// Interactive wrapper component
const MultiSelectorWrapper = (args: any) => {
  const [selected, setSelected] = useState<Option[]>(args.selected || [])

  return (
    <div style={{ width: '320px' }}>
      <MultiSelector {...args} selected={selected} onChange={setSelected} />
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
        <strong>Selected:</strong>{' '}
        {selected.length > 0 ? selected.map((s) => s.label).join(', ') : 'None'}
      </div>
    </div>
  )
}

export const Default: Story = {
  render: (args) => <MultiSelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    selected: [],
    placeholder: 'Select frameworks...',
    onChange: fn(),
  },
}

export const WithLabel: Story = {
  render: (args) => <MultiSelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    selected: [],
    label: 'Choose Frameworks',
    placeholder: 'Select frameworks...',
    onChange: () => {},
  },
}

export const WithPreselected: Story = {
  render: (args) => <MultiSelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    selected: [sampleOptions[0], sampleOptions[2]],
    label: 'Favorite Frameworks',
    placeholder: 'Select frameworks...',
    onChange: () => {},
  },
}

export const Disabled: Story = {
  render: (args) => <MultiSelectorWrapper {...args} />,
  args: {
    options: sampleOptions,
    selected: [sampleOptions[0]],
    label: 'Frameworks (Disabled)',
    placeholder: 'Select frameworks...',
    disabled: true,
    onChange: fn(),
  },
  play: async ({ args, canvasElement }) => {
    // Find the disabled button
    const button = canvasElement.querySelector('button')

    // Verify button is disabled
    expect(button?.disabled).toBe(true)

    // Try to click the disabled button
    button?.click()

    // Verify onChange was not called (button is disabled)
    expect(args.onChange).not.toHaveBeenCalled()
  },
}
