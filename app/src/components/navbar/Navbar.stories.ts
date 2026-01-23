import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router'
import { Navbar } from './Navbar'

const meta = {
  title: 'UI/Navbar',
  component: Navbar,
  tags: ['autodocs'],
  decorators: [withRouter],
  parameters: {
    reactRouter: reactRouterParameters({
      location: {
        pathParams: { userId: '42' },
      },
      routing: { path: '/users/:userId' },
    }),
    layout: 'fullscreen',
  },
  args: {
    title: 'EJC Rosário',
    imageSrc: '/church.svg',
    navItems: [
      { name: 'Inscrição', to: '/registration' },
      { name: 'Dashboard', to: '/dashboard' },
      { name: 'Equipes', to: '/teams' },
    ],
  },
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const NavbarExample: Story = {}
