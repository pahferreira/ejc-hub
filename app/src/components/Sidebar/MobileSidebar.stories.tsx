import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { withRouter } from 'storybook-addon-remix-react-router'
import { MobileSidebar } from './MobileSidebar'
import { sidebarNavGroups } from './sidebarNav'

/**
 * The navigation overlay for small screens. `AppLayout` only opens it below the
 * `md` breakpoint; the component itself renders wherever it is told to, so
 * these stories show it at any viewport width.
 */
const meta = {
  title: 'Components/MobileSidebar',
  component: MobileSidebar,
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  args: {
    groups: sidebarNavGroups,
    userName: 'Pah Ferreira',
    userPicture: 'https://i.pravatar.cc/150?u=pah',
    onLogout: fn(),
    onClose: fn(),
    open: true,
  },
} satisfies Meta<typeof MobileSidebar>

export default meta
type Story = StoryObj<typeof meta>

export const Open: Story = {
  play: async ({ canvasElement }) => {
    // The dialog is portalled to the body, so the canvas element is empty.
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByRole('dialog')).toBeVisible()
    await expect(screen.getByRole('link', { name: 'Início' })).toBeVisible()
  },
}

export const Closed: Story = {
  args: {
    open: false,
  },
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  },
}

/**
 * The overlay floats above the page instead of taking a column out of it, so
 * the scrim is the primary way to dismiss it.
 */
export const BackdropClickCloses: Story = {
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByTestId('mobile-sidebar-backdrop'))

    await waitFor(() => expect(args.onClose).toHaveBeenCalled())
  },
}

export const CloseButtonCloses: Story = {
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(screen.getByRole('button', { name: 'Fechar menu' }))

    await waitFor(() => expect(args.onClose).toHaveBeenCalled())
  },
}

export const EscapeCloses: Story = {
  play: async ({ args, canvasElement }) => {
    const screen = within(canvasElement.ownerDocument.body)

    await expect(screen.getByRole('dialog')).toBeVisible()
    await userEvent.keyboard('{Escape}')

    await waitFor(() => expect(args.onClose).toHaveBeenCalled())
  },
}
