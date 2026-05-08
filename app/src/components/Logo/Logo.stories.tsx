import type { Meta, StoryObj } from '@storybook/react-vite'
import { Logo } from './Logo'

const meta = {
  title: 'UI/Logo',
  tags: ['autodocs'],
  component: Logo,
} satisfies Meta<typeof Logo>

export const Primary = {
  args: {},
} satisfies StoryObj

export default meta
