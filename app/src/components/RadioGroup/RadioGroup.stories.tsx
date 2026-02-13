import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/internal/test'
import { RadioGroup } from './RadioGroup'

const meta = {
  title: 'UI/RadioGroup',
  component: RadioGroup,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onChange: { action: 'changed' },
  },
} satisfies Meta<typeof RadioGroup>

export default meta

export const Default = {
  args: {
    label: 'Have you participated in events before?',
    description: 'Let us know about your previous experience',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
    selected: 'no',
  },
} satisfies StoryObj<typeof RadioGroup>

export const Stacked = {
  args: {
    label: 'Have you participated in events before?',
    description: 'Let us know about your previous experience',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
    selected: 'no',
    variant: 'stacked',
  },
} satisfies StoryObj<typeof RadioGroup>

export const WithSelection = {
  args: {
    label: 'Have you participated in events before?',
    options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No', value: 'no' },
    ],
    selected: 'no',
    onChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const yesRadio = canvas.getByLabelText('Yes')
    const noRadio = canvas.getByLabelText('No')

    expect(noRadio).toBeChecked()
    expect(yesRadio).not.toBeChecked()

    await userEvent.click(yesRadio)
    expect(args.onChange).toHaveBeenCalledWith('yes')
  },
} satisfies StoryObj<typeof RadioGroup>
