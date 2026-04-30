import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { WizardStepper } from './WizardStepper'

const steps = [
  { id: 'personal' as const, label: 'Dados Pessoais' },
  { id: 'profile' as const, label: 'Perfil' },
  { id: 'teams' as const, label: 'Equipes' },
  { id: 'confirm' as const, label: 'Confirmação' },
]

const meta = {
  title: 'Components/WizardStepper',
  component: WizardStepper,
  tags: ['autodocs'],
  args: {
    steps,
    onStepClick: fn(),
  },
} satisfies Meta<typeof WizardStepper>

export default meta

export const FirstStepActive = {
  args: {
    currentStep: 'personal',
    maxReachedStepIndex: 0,
  },
} satisfies StoryObj<typeof WizardStepper>

export const MiddleStepActive = {
  args: {
    currentStep: 'profile',
    maxReachedStepIndex: 1,
  },
} satisfies StoryObj<typeof WizardStepper>

export const LastStepActive = {
  args: {
    currentStep: 'confirm',
    maxReachedStepIndex: 3,
  },
} satisfies StoryObj<typeof WizardStepper>

export const AllStepsCompleted = {
  args: {
    currentStep: 'confirm',
    maxReachedStepIndex: 3,
  },
} satisfies StoryObj<typeof WizardStepper>
