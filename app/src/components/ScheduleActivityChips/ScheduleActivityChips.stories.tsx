import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { ScheduleActivityChips } from './ScheduleActivityChips'

const meta = {
  title: 'Schedule/ScheduleActivityChips',
  component: ScheduleActivityChips,
  args: {
    myTeamInstanceId: 't-cozinha',
    activity: {
      adminsResponsible: true,
      allTeams: false,
      guestName: 'Pe. João',
      teams: [
        {
          teamInstanceId: 't-cozinha',
          teamName: 'Cozinha',
          teamKey: 'cozinha',
          colorToken: 'amber',
        },
        {
          teamInstanceId: 't-liturgia',
          teamName: 'Liturgia',
          teamKey: 'liturgia',
          colorToken: 'violet',
        },
      ],
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScheduleActivityChips>

export default meta
type Story = StoryObj<typeof meta>

/** Coord. Geral, the guest and each team; the viewer's team is filled. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Coord. Geral')).toBeVisible()
    await expect(canvas.getByText('Convidado: Pe. João')).toBeVisible()
    await expect(canvas.getByText('Cozinha')).toHaveClass('bg-primary')
    await expect(canvas.getByText('Liturgia')).not.toHaveClass('bg-primary')
  },
}

/** The guest left out, for a card that names it beside the place. */
export const WithoutGuest: Story = {
  args: { withoutGuest: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByText('Convidado: Pe. João')).not.toBeInTheDocument()
  },
}

/** Every team, as a live wildcard. */
export const AllTeams: Story = {
  args: {
    activity: { adminsResponsible: false, allTeams: true, guestName: null, teams: [] },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText('Todas as equipes')).toBeVisible()
  },
}
