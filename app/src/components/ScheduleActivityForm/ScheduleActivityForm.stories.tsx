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
  allTeams: false,
}

/** Holds the form's values so typing works in the story. */
function StatefulForm(props: {
  initial?: Partial<ScheduleActivityFormValues>
  error?: string
  mode?: 'create' | 'edit'
  onSubmit: () => void
  onCancel: () => void
  onDelete?: () => void
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
        mode={props.mode}
        onDelete={props.onDelete}
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

/** Editing: titled "EDITAR ATIVIDADE", pre-filled, with Excluir and Salvar alterações. */
export const Edit: Story = {
  args: {
    mode: 'edit',
    onDelete: fn(),
    initial: {
      title: 'Missa',
      startTime: '19:00',
      durationMinutes: 60,
      place: 'Capela',
      teamInstanceIds: ['t2'],
      guestName: 'Padre João',
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Editar atividade')).toBeInTheDocument()
    await expect(canvas.getByLabelText('Título*')).toHaveValue('Missa')
    await expect(canvas.getByText('Termina às 20:00')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Adicionar atividade' })).toBeNull()

    await userEvent.click(canvas.getByRole('button', { name: 'Excluir' }))
    await expect(args.onDelete).toHaveBeenCalledOnce()

    await userEvent.click(canvas.getByRole('button', { name: 'Salvar alterações' }))
    await expect(args.onSubmit).toHaveBeenCalledOnce()
  },
}

/**
 * "Todas as equipes participam": checking it clears the picked teams and
 * disables the selector; unchecking it leaves the selector empty.
 */
export const AllTeams: Story = {
  args: {
    initial: {
      title: 'Plenária',
      place: 'Salão',
      startTime: '09:00',
      teamInstanceIds: ['t1', 't2'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const teamSelector = canvas.getByRole('button', { name: '2 selected' })
    const allTeams = canvas.getByLabelText('Todas as equipes participam')

    await userEvent.click(allTeams)
    await expect(allTeams).toBeChecked()
    await expect(teamSelector).toBeDisabled()
    await expect(teamSelector).toHaveTextContent('Buscar equipes...')

    await userEvent.click(allTeams)
    await expect(allTeams).not.toBeChecked()
    await expect(teamSelector).toBeEnabled()
    await expect(teamSelector).toHaveTextContent('Buscar equipes...')
  },
}
