import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/internal/test'
import { Checkbox } from './Checkbox'

const meta = {
  title: 'UI/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof Checkbox>

export default meta

export const Default = {
  args: {
    label: 'JavaScript',
  },
} satisfies StoryObj<typeof Checkbox>

export const Checked = {
  args: {
    label: 'TypeScript',
    checked: true,
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole('checkbox')
    await userEvent.click(checkbox)
    expect(args.onChange).toHaveBeenCalledWith(false)
  },
} satisfies StoryObj<typeof Checkbox>

export const Disabled = {
  args: {
    label: 'React',
    checked: false,
    disabled: true,
  },
} satisfies StoryObj<typeof Checkbox>
