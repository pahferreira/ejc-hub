import type { Meta, StoryObj } from '@storybook/react-vite'
import { ExperienceBadge } from './ExperienceBadge'

const meta = {
  title: 'UI/ExperienceBadge',
  component: ExperienceBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof ExperienceBadge>

export default meta

export const Newbie: StoryObj<typeof ExperienceBadge> = {
  args: {
    experienceType: 'newbie',
  },
}

export const NewbieRedCircle: StoryObj<typeof ExperienceBadge> = {
  args: {
    experienceType: 'newbie',
    circleKey: 'red',
  },
}

export const NewbieGreenCircle: StoryObj<typeof ExperienceBadge> = {
  args: {
    experienceType: 'newbie',
    circleKey: 'green',
  },
}

export const NewbieBlueCircle: StoryObj<typeof ExperienceBadge> = {
  args: {
    experienceType: 'newbie',
    circleKey: 'blue',
  },
}

export const Experienced: StoryObj<typeof ExperienceBadge> = {
  args: {
    experienceType: 'experienced',
  },
}

export const ExperiencedOutsider: StoryObj<typeof ExperienceBadge> = {
  args: {
    experienceType: 'experienced_outsider',
  },
}
