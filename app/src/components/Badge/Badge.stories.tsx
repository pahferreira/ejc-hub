import type { Meta, StoryObj } from '@storybook/react-vite'
import { Badge } from './Badge'

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>

export default meta

export const Default: StoryObj<typeof Badge> = {
  args: {
    children: 'Default',
  },
}

export const Warning: StoryObj<typeof Badge> = {
  args: {
    children: 'Warning',
    variant: 'warning',
  },
}

export const Error: StoryObj<typeof Badge> = {
  args: {
    children: 'Error',
    variant: 'error',
  },
}

export const Success: StoryObj<typeof Badge> = {
  args: {
    children: 'Success',
    variant: 'success',
  },
}

export const Info: StoryObj<typeof Badge> = {
  args: {
    children: 'Info',
    variant: 'info',
  },
}
