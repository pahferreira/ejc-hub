import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import { expect, fn } from 'storybook/test'

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

export const Destructive = {
  args: {
    children: 'Cancelar Inscrição',
    disabled: false,
    variant: 'destructive',
  },
} satisfies StoryObj<typeof Button>

export const Small = {
  args: {
    children: 'Marcar todos',
    disabled: false,
    size: 'small',
  },
} satisfies StoryObj<typeof Button>

export const SmallSecondary = {
  args: {
    children: 'Justificar',
    disabled: false,
    variant: 'secondary',
    size: 'small',
  },
} satisfies StoryObj<typeof Button>

export default meta
