import type { Meta, StoryObj } from '@storybook/react-vite'
import { withRouter } from 'storybook-addon-remix-react-router'
import { TeamCard } from './TeamCard'

const meta = {
  title: 'UI/TeamCard',
  component: TeamCard,
  parameters: {
    layout: 'padded',
  },
  // The assigned variant renders a react-router <Link>, so stories need a router.
  decorators: [withRouter],
  tags: ['autodocs'],
} satisfies Meta<typeof TeamCard>

export default meta
type Story = StoryObj<typeof meta>

export const Assigned: Story = {
  args: {
    variant: 'assigned',
    team: {
      id: 'team-1',
      name: 'Liturgia',
      description: 'Prepara e conduz momentos de oração e celebrações.',
      coordinators: [
        { id: 'u1', name: 'Maria Silva', phone: '(11) 98765-4321' },
        { id: 'u2', name: 'João Santos', phone: '(11) 91234-5678' },
      ],
    },
  },
}

export const AssignedWithoutDescription: Story = {
  args: {
    variant: 'assigned',
    team: {
      id: 'team-2',
      name: 'Cozinha',
      description: null,
      coordinators: [{ id: 'u3', name: 'Ana Souza', phone: null }],
    },
  },
}

export const AssignedNoCoordinators: Story = {
  args: {
    variant: 'assigned',
    team: {
      id: 'team-3',
      name: 'Recepção',
      description: 'Acolhe os participantes na chegada.',
      coordinators: [],
    },
  },
}

const liturgia = {
  id: 'team-1',
  name: 'Liturgia',
  description: 'Prepara e conduz momentos de oração e celebrações.',
  coordinators: [{ id: 'u1', name: 'Maria Silva', phone: '(11) 98765-4321' }],
}

export const AssignedAttendanceGood: Story = {
  args: {
    variant: 'assigned',
    team: liturgia,
    attendanceRate: { present: 7, eligible: 9, justified: 2, percentage: 78, band: 'good' },
  },
}

export const AssignedAttendanceRisky: Story = {
  args: {
    variant: 'assigned',
    team: liturgia,
    attendanceRate: { present: 6, eligible: 10, justified: 0, percentage: 60, band: 'risky' },
  },
}

export const AssignedAttendanceNeedsReplacement: Story = {
  args: {
    variant: 'assigned',
    team: liturgia,
    attendanceRate: {
      present: 2,
      eligible: 8,
      justified: 1,
      percentage: 25,
      band: 'needs-replacement',
    },
  },
}

export const AssignedAttendanceInsufficientData: Story = {
  args: {
    variant: 'assigned',
    team: liturgia,
    attendanceRate: {
      present: 1,
      eligible: 1,
      justified: 0,
      percentage: 100,
      band: 'insufficient-data',
    },
  },
}

export const AssignedAttendanceNoMeetings: Story = {
  args: {
    variant: 'assigned',
    team: liturgia,
    attendanceRate: {
      present: 0,
      eligible: 0,
      justified: 0,
      percentage: null,
      band: 'no-meetings',
    },
  },
}

export const Pending: Story = {
  args: {
    variant: 'pending',
    preferences: [
      { key: 'music', name: 'Musica' },
      { key: 'liturgy', name: 'Liturgia' },
    ],
  },
}

export const PendingNoPreferences: Story = {
  args: {
    variant: 'pending',
    preferences: [],
  },
}

export const WaitingList: Story = {
  args: {
    variant: 'waitingList',
    preferences: [
      { key: 'music', name: 'Musica' },
      { key: 'liturgy', name: 'Liturgia' },
    ],
  },
}

export const WaitingListNoPreferences: Story = {
  args: {
    variant: 'waitingList',
    preferences: [],
  },
}
