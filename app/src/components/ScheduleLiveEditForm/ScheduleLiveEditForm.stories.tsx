import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { ScheduleLiveEditForm } from './ScheduleLiveEditForm'
import {
  liveEditFields,
  type LiveEditFieldErrors,
  type LiveEditFormValues,
} from '../../utils/scheduleLiveEdit/scheduleLiveEdit'
import type { ScheduleActivityStatus } from '../../services/schedule/schedule.types'

/** Holds the form's values so typing works in the story. */
function StatefulForm(props: {
  status: ScheduleActivityStatus
  initial: LiveEditFormValues
  fieldErrors?: LiveEditFieldErrors
  error?: string
  onSubmit: () => void
  onCancel: () => void
}) {
  const [values, setValues] = useState<LiveEditFormValues>(props.initial)

  return (
    <div className="max-w-xl p-4">
      <ScheduleLiveEditForm
        title="Palestra: O amor de Deus"
        durationMinutes={45}
        fields={liveEditFields(props.status)}
        values={values}
        onChange={(patch) => setValues((current) => ({ ...current, ...patch }))}
        fieldErrors={props.fieldErrors}
        error={props.error}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
      />
    </div>
  )
}

const meta = {
  title: 'Schedule/ScheduleLiveEditForm',
  component: StatefulForm,
  args: {
    status: 'planned',
    initial: { adjustedDuration: '', startTime: '', endTime: '' },
    onSubmit: fn(),
    onCancel: fn(),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatefulForm>

export default meta
type Story = StoryObj<typeof meta>

/** An upcoming activity: only the trim, with the planned duration for reference. */
export const Planned: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Planejada: 45 min')).toBeVisible()
    await expect(canvas.queryByLabelText('Início real')).not.toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: 'Remover ajuste' })).not.toBeInTheDocument()

    await userEvent.type(canvas.getByLabelText('Duração ajustada (min)'), '30')
    await userEvent.click(canvas.getByRole('button', { name: 'Salvar ajuste' }))
    await expect(args.onSubmit).toHaveBeenCalled()
  },
}

/** A trimmed activity: "Remover ajuste" empties the trim. */
export const Trimmed: Story = {
  args: { initial: { adjustedDuration: '30', startTime: '', endTime: '' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await userEvent.click(canvas.getByRole('button', { name: 'Remover ajuste' }))
    await expect(canvas.getByLabelText('Duração ajustada (min)')).toHaveValue(null)
  },
}

/** The running activity: the trim and its actual start, no end yet. */
export const Running: Story = {
  args: {
    status: 'running',
    initial: { adjustedDuration: '', startTime: '18:07', endTime: '' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByLabelText('Duração ajustada (min)')).toBeVisible()
    await expect(canvas.getByLabelText('Início real*')).toHaveValue('18:07')
    await expect(canvas.queryByLabelText('Fim real*')).not.toBeInTheDocument()
  },
}

/** A done activity: its actual start and end, no trim. */
export const Done: Story = {
  args: {
    status: 'done',
    initial: { adjustedDuration: '', startTime: '18:07', endTime: '18:55' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.queryByLabelText('Duração ajustada (min)')).not.toBeInTheDocument()
    await expect(canvas.getByLabelText('Início real*')).toHaveValue('18:07')
    await expect(canvas.getByLabelText('Fim real*')).toHaveValue('18:55')
  },
}

/** The API refused the times: the error shows on the form. */
export const ApiError: Story = {
  args: {
    status: 'done',
    initial: { adjustedDuration: '', startTime: '18:07', endTime: '18:55' },
    error:
      'Confira os horários: o início precisa ser antes do fim e não pode se sobrepor ao de outra atividade.',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText(/o início precisa ser antes do fim/)).toBeVisible()
  },
}

/** A field left malformed: its error shows under it. */
export const FieldErrors: Story = {
  args: {
    initial: { adjustedDuration: '0', startTime: '', endTime: '' },
    fieldErrors: { adjustedDuration: 'Informe uma duração maior que zero' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByText('Informe uma duração maior que zero')).toBeVisible()
  },
}
