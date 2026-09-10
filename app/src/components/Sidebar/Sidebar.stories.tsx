import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'
import { SidebarView } from './Sidebar.tsx'
import { sidebarNavGroups } from './sidebar.ts'
import { reactRouterParameters, withRouter } from 'storybook-addon-remix-react-router'
import { ROUTE_PATHS } from '../../constants/routePaths.ts'

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

/**
 * "Taxa por Membro" lives below "Taxa por Equipe" in the URL tree
 * (`/financial/event-fee/members` vs `/financial/event-fee`), so the parent
 * link has to opt out of `NavLink`'s prefix matching. Without that, both
 * entries highlight at once on this route.
 */
export const NestedRouteHighlightsOnlyTheLeaf: Story = {
  args: {
    groups: sidebarNavGroups,
    userName: 'Pah Ferreira',
    isCollapsed: false,
  },
  parameters: {
    reactRouter: reactRouterParameters({
      routing: { path: ROUTE_PATHS.EVENT_FEE_MEMBERS },
      location: { path: ROUTE_PATHS.EVENT_FEE_MEMBERS },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('link', { name: 'Taxa por Membro' })).toHaveClass('bg-tertiary')
    await expect(canvas.getByRole('link', { name: 'Taxa por Equipe' })).not.toHaveClass(
      'bg-tertiary'
    )
  },
}

/**
 * The default prefix match is still what the items without nested nav entries
 * rely on: a team detail page keeps "Equipes" lit.
 */
export const NestedRouteWithoutOwnEntryHighlightsAncestor: Story = {
  args: {
    groups: sidebarNavGroups,
    userName: 'Pah Ferreira',
    isCollapsed: false,
  },
  parameters: {
    reactRouter: reactRouterParameters({
      routing: { path: ROUTE_PATHS.TEAM_DETAIL },
      location: { path: '/teams/liturgia' },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('link', { name: 'Equipes' })).toHaveClass('bg-tertiary')
  },
}
