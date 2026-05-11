import type { Meta, StoryObj } from '@storybook/react-vite'
import { ProgressBar } from './ProgressBar'

const meta = {
  title: 'UI/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProgressBar>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {
  args: {
    label: 'Progress',
    value: 10,
    max: 10,
    variant: 'green',
  },
}

export const Partial: Story = {
  args: {
    label: 'Progress',
    value: 6,
    max: 10,
    variant: 'red',
  },
}

export const Empty: Story = {
  args: {
    label: 'Progress',
    value: 0,
    max: 10,
    variant: 'green',
  },
}

export const NoMax: Story = {
  args: {
    label: 'Progress',
    value: 0,
    max: 0,
    variant: 'green',
  },
}

export const PresenceUseCase: Story = {
  args: {
    label: 'Presença em Reuniões',
    value: 3,
    max: 5,
    variant: 'green',
    descriptionSuffix: ' de presença',
  },
}
