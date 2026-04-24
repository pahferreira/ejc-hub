import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { SidebarView } from './Sidebar.tsx'
import { sidebarNavGroups } from './sidebar.ts'
import { withRouter } from 'storybook-addon-remix-react-router'

const meta = {
  title: 'Components/Sidebar',
  component: SidebarView,
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    onLogout: fn(),
    onToggleCollapse: fn(),
  },
} satisfies Meta<typeof SidebarView>

export default meta
type Story = StoryObj<typeof meta>

export const Expanded: Story = {
  args: {
    groups: sidebarNavGroups,
    userName: 'Pah Ferreira',
    userPicture: 'https://i.pravatar.cc/150?u=pah',
    isCollapsed: false,
  },
}

export const Collapsed: Story = {
  args: {
    groups: sidebarNavGroups,
    userName: 'Pah Ferreira',
    userPicture: 'https://i.pravatar.cc/150?u=pah',
    isCollapsed: true,
  },
}

export const WithoutPicture: Story = {
  args: {
    groups: sidebarNavGroups,
    userName: 'Pah Ferreira',
    isCollapsed: false,
  },
}

export const SingleGroup: Story = {
  args: {
    groups: [sidebarNavGroups[0]],
    userName: 'Pah Ferreira',
    isCollapsed: false,
  },
}
