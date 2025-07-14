import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  withRouter,
  reactRouterParameters,
} from 'storybook-addon-remix-react-router'
import { Navbar } from '../components/navbar/Navbar'

const meta = {
  title: 'Example/Navbar',
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
} satisfies Meta<typeof Navbar>

export default meta
type Story = StoryObj<typeof meta>

export const NavbarExample: Story = {}
