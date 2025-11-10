import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/internal/test'
import { TeamBox } from './TeamBox'

const meta = {
  title: 'UI/TeamBox',
  component: TeamBox,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    onToggle: { action: 'changed' },
  },
} satisfies Meta<typeof TeamBox>

export default meta

export const Default = {
  args: {
    title: 'Eagles',
    description: 'Soaring high with keen vision and precision',
  },
} satisfies StoryObj<typeof TeamBox>

export const Selected = {
  args: {
    title: 'Eagles',
    description: 'Soaring high with keen vision and precision',
    defaultSelected: false,
    onToggle: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('checkbox')
    await userEvent.click(button)
    expect(args.onToggle).toHaveBeenCalledWith(true)
  },
} satisfies StoryObj<typeof TeamBox>

export const Disabled = {
  args: {
    title: 'Eagles',
    description: 'Soaring high with keen vision and precision',
    disabled: true,
  },
} satisfies StoryObj<typeof TeamBox>
