import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { expect, fn } from 'storybook/internal/test'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
} satisfies Meta<typeof Button>

export const Primary = {
  args: {
    children: 'Register for event',
    disabled: false,
    onClick: fn(),
  },
  play: async ({ args, canvasElement }) => {
    const button = canvasElement.querySelector('button')
    button?.click()
    expect(args.onClick).toHaveBeenCalled()
  },
} satisfies StoryObj<typeof Button>

export const Secondary = {
  args: {
    children: 'Add member',
    disabled: false,
    variant: 'secondary',
  },
} satisfies StoryObj<typeof Button>

export const Tertiary = {
  args: {
    children: 'Add member',
    disabled: false,
    variant: 'tertiary',
  },
} satisfies StoryObj<typeof Button>

export default meta
