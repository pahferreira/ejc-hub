import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleActivityForm } from './ScheduleActivityForm'
import type { ScheduleActivityFormValues } from '../../utils/scheduleActivity/scheduleActivity'

const TEAM_OPTIONS = [
  { value: 't1', label: 'Acolhida' },
  { value: 't2', label: 'Liturgia' },
  { value: 't3', label: 'Música' },
]

const INITIAL: ScheduleActivityFormValues = {
  title: '',
  startTime: '08:00',
  durationMinutes: 30,
  place: '',
  teamInstanceIds: [],
  guestName: '',
  adminsResponsible: false,
}

/** Holds the form's values so typing works in the story. */
function StatefulForm(props: {
  initial?: Partial<ScheduleActivityFormValues>
  error?: string
  onSubmit: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<ScheduleActivityFormValues>({ ...INITIAL, ...props.initial })

  return (
    <div className="max-w-xl p-4">
      <ScheduleActivityForm
        values={values}
        onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        teamOptions={TEAM_OPTIONS}
        error={props.error}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
      />
    </div>
  )
}

const meta = {
  title: 'Schedule/ScheduleActivityForm',
  component: StatefulForm,
  args: {
    onSubmit: fn(),
    onCancel: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatefulForm>

export default meta
type Story = StoryObj<typeof meta>

/** The live "Termina às" tracks the start and duration. */
export const Default: Story = {
  args: {
    initial: { startTime: '18:00', durationMinutes: 30 },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Termina às 18:30')).toBeInTheDocument()

    await userEvent.type(canvas.getByLabelText('Título*'), 'Acolhida')
    await userEvent.type(canvas.getByLabelText('Local*'), 'Salão')
    await userEvent.click(canvas.getByRole('button', { name: 'Adicionar atividade' }))
    await expect(args.onSubmit).toHaveBeenCalledOnce()
  },
}

/** An API validation error (overlap, nobody responsible…) shows on the form. */
export const WithError: Story = {
  args: {
    initial: { title: 'Acolhida', place: 'Salão', startTime: '18:00' },
    error: 'A atividade se sobrepõe a outra.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('A atividade se sobrepõe a outra.')).toBeInTheDocument()
  },
}
