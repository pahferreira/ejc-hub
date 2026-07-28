import type { Meta, StoryObj } from '@storybook/react-vite'
import { UserAvatar } from './UserAvatar'

const meta = {
  title: 'UI/UserAvatar',
  component: UserAvatar,
  tags: ['autodocs'],
} satisfies Meta<typeof UserAvatar>

export default meta
type Story = StoryObj<typeof meta>

export const DefaultWithPhoto: Story = {
  args: {
    name: 'Alice Ribeiro',
    pictureUrl: 'https://i.pravatar.cc/80?img=5',
    size: 'default',
  },
}

export const DefaultNoPhoto: Story = {
  args: {
    name: 'Alice Ribeiro',
    pictureUrl: null,
    size: 'default',
  },
}

export const DefaultBrokenPhoto: Story = {
  args: {
    name: 'Alice Ribeiro',
    pictureUrl: 'https://example.invalid/broken.jpg',
    size: 'default',
  },
}

export const SmallWithPhoto: Story = {
  args: {
    name: 'Bruno Carvalho',
    pictureUrl: 'https://i.pravatar.cc/80?img=12',
    size: 'small',
  },
}

export const SmallNoPhoto: Story = {
  args: {
    name: 'Bruno Carvalho',
    pictureUrl: null,
    size: 'small',
  },
}

export const SmallBrokenPhoto: Story = {
  args: {
    name: 'Bruno Carvalho',
    pictureUrl: 'https://example.invalid/broken.jpg',
    size: 'small',
  },
}
