import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleDayActivities } from './ScheduleDayActivities'
import type {
  ScheduleActivityFormPlacement,
  useScheduleActivityForm,
} from '../ScheduleActivityForm/useScheduleActivityForm'
import type { useDeleteScheduleActivity } from '../DeleteScheduleActivityModal/useDeleteScheduleActivity'
import type { ScheduleActivity } from '../../services/schedule/schedule.types'
import {
  activityFormValues,
  type ScheduleActivityFormValues,
} from '../../utils/scheduleActivity/scheduleActivity'

// Friday 03 April 2026 in São Paulo (UTC-3).
const ACTIVITIES: ScheduleActivity[] = [
  {
    id: 'almoco',
    title: 'Almoço',
    plannedStartsAt: '2026-04-03T15:00:00Z', // 12:00
    durationMinutes: 60,
    place: 'Refeitório',
    guestName: null,
    adminsResponsible: true,
    allTeams: false,
    teams: [],
  },
  {
    id: 'palestra',
    title: 'Palestra',
    plannedStartsAt: '2026-04-03T17:00:00Z', // 14:00, after a free hour
    durationMinutes: 45,
    place: 'Salão',
    guestName: 'Padre João',
    adminsResponsible: false,
    allTeams: false,
    teams: [
      { teamInstanceId: 't1', teamName: 'Liturgia', teamKey: 'liturgia', colorToken: 'blue' },
    ],
  },
]

const TEAM_OPTIONS = [
  { value: 't1', label: 'Liturgia' },
  { value: 't2', label: 'Música' },
]

const EMPTY_VALUES: ScheduleActivityFormValues = {
  title: '',
  startTime: '06:00',
  durationMinutes: 30,
  place: '',
  teamInstanceIds: [],
  guestName: '',
  adminsResponsible: false,
  allTeams: false,
}

/**
 * Stand-ins for `useScheduleActivityForm` and `useDeleteScheduleActivity`: same
 * placements and pre-fill, no API, so the story can walk the edit and gap flows.
 */
function StatefulDay(props: { onSubmit: () => void; onConfirmDelete: () => void }) {
  const [placement, setPlacement] = useState<ScheduleActivityFormPlacement | null>(null)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  const form: ReturnType<typeof useScheduleActivityForm> = {
    isOpen: placement !== null,
    placement,
    editingActivityId: placement?.kind === 'edit' ? placement.activityId : undefined,
    open: (startTime = '06:00') => {
      setValues({ ...EMPTY_VALUES, startTime })
      setPlacement({ kind: 'end' })
    },
    fillGap: (gap) => {
      setValues({ ...EMPTY_VALUES, startTime: gap.startTime, durationMinutes: gap.durationMinutes })
      setPlacement({ kind: 'gap', afterActivityId: gap.afterActivityId })
    },
    edit: (activity) => {
      setValues(activityFormValues(activity))
      setPlacement({ kind: 'edit', activityId: activity.id })
    },
    close: () => setPlacement(null),
    values,
    change: (patch) => setValues((current) => ({ ...current, ...patch })),
    fieldErrors: {},
    error: undefined,
    submit: props.onSubmit,
    isSubmitting: false,
  }

  const deletion: ReturnType<typeof useDeleteScheduleActivity> = {
    isConfirming: isConfirmingDelete,
    ask: () => setIsConfirmingDelete(true),
    cancel: () => setIsConfirmingDelete(false),
    confirm: () => {
      props.onConfirmDelete()
      setIsConfirmingDelete(false)
      setPlacement(null)
    },
    isDeleting: false,
  }

  return (
    <div className="max-w-xl p-4">
      <ScheduleDayActivities
        activities={ACTIVITIES}
        dayDate="2026-04-03"
        teamOptions={TEAM_OPTIONS}
        form={form}
        deletion={deletion}
      />
    </div>
  )
}

const meta = {
  title: 'Schedule/ScheduleDayActivities',
  component: StatefulDay,
  args: {
    onSubmit: fn(),
    onConfirmDelete: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatefulDay>

export default meta
type Story = StoryObj<typeof meta>

/** A free hour between two activities shows as a gap row with "Preencher". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Intervalo livre · 13:00–14:00 · 1h')).toBeInTheDocument()
  },
}

/** "Preencher" opens a new-activity form with the gap's start and length. */
export const FillGap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Preencher' }))

    await expect(canvas.getByText('Nova atividade')).toBeInTheDocument()
    await expect(canvas.getByLabelText('Início*')).toHaveValue('13:00')
    await expect(canvas.getByLabelText('Duração (min)*')).toHaveValue(60)
    await expect(canvas.getByText('Termina às 14:00')).toBeInTheDocument()
  },
}

/** The pencil swaps the card for the pre-filled edit form; Excluir asks first. */
export const EditAndDelete: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    const screen = within(canvasElement.ownerDocument.body)

    await userEvent.click(canvas.getByRole('button', { name: 'Editar Palestra' }))

    await expect(canvas.getByText('Editar atividade')).toBeInTheDocument()
    await expect(canvas.getByLabelText('Título*')).toHaveValue('Palestra')
    await expect(canvas.getByLabelText('Início*')).toHaveValue('14:00')
    await expect(canvas.getByLabelText('Convidado')).toHaveValue('Padre João')

    await userEvent.click(canvas.getByRole('button', { name: 'Excluir' }))
    await expect(args.onConfirmDelete).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Excluir atividade' }))
    await expect(args.onConfirmDelete).toHaveBeenCalledOnce()
  },
}
