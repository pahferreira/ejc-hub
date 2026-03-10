import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
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

export const WithLogout: Story = {
  args: {
    logout: { label: 'Sair', onClick: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const logoutButton = canvas.getByRole('button')
    await userEvent.click(logoutButton)
    expect(args.logout!.onClick).toHaveBeenCalled()
  },
}

export const WithLogoutIconOnly: Story = {
  args: {
    logout: { onClick: fn() },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const logoutButton = canvas.getByRole('button')
    await userEvent.click(logoutButton)
    expect(args.logout!.onClick).toHaveBeenCalled()
  },
}
