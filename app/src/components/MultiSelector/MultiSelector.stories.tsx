import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
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
const MultiSelectorWrapper = (args: React.ComponentProps<typeof MultiSelector>) => {
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

// A short `overflow-auto` box with the field at its bottom, like the schedule
// form at the end of `main` (#371). The list has to escape the box.
export const InsideScrollContainer: Story = {
  render: (args) => (
    <div style={{ height: '120px', overflow: 'auto' }}>
      <div style={{ paddingTop: '40px' }}>
        <MultiSelectorWrapper {...args} />
      </div>
    </div>
  ),
  args: {
    options: sampleOptions,
    selected: [],
    label: 'Equipes',
    placeholder: 'Select frameworks...',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    await userEvent.click(screen.getByRole('button', { name: /select frameworks/i }))

    const listbox = await screen.findByRole('listbox')
    const rect = listbox.getBoundingClientRect()
    const bottomEdge = canvasElement.ownerDocument.elementFromPoint(
      rect.left + rect.width / 2,
      rect.bottom - 4
    )
    await expect(listbox.contains(bottomEdge)).toBe(true)
  },
}

// Pinned to the bottom of the viewport: no room below, so the list opens upward.
export const AtViewportBottom: Story = {
  render: (args) => (
    <div style={{ position: 'fixed', bottom: '8px', left: '8px' }}>
      <MultiSelectorWrapper {...args} />
    </div>
  ),
  args: {
    options: sampleOptions,
    selected: [],
    placeholder: 'Select frameworks...',
    onChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)
    const button = screen.getByRole('button', { name: /select frameworks/i })
    await userEvent.click(button)

    const listbox = await screen.findByRole('listbox')
    await expect(listbox.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      button.getBoundingClientRect().top
    )
  },
}
