import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { WizardFooter } from './WizardFooter'

const meta = {
  title: 'Components/WizardFooter',
  component: WizardFooter,
  tags: ['autodocs'],
  args: {
    onBack: fn(),
    onNext: fn(),
    onSubmit: fn(),
    isNavigating: false,
    isSubmitting: false,
  },
} satisfies Meta<typeof WizardFooter>

export default meta

export const FirstStep = {
  args: {
    isFirst: true,
    isLast: false,
  },
} satisfies StoryObj<typeof WizardFooter>

export const MiddleStep = {
  args: {
    isFirst: false,
    isLast: false,
  },
} satisfies StoryObj<typeof WizardFooter>

export const LastStep = {
  args: {
    isFirst: false,
    isLast: true,
  },
} satisfies StoryObj<typeof WizardFooter>

export const SubmittingState = {
  args: {
    isFirst: false,
    isLast: true,
    isSubmitting: true,
  },
} satisfies StoryObj<typeof WizardFooter>

export const NavigatingState = {
  args: {
    isFirst: false,
    isLast: false,
    isNavigating: true,
  },
} satisfies StoryObj<typeof WizardFooter>
