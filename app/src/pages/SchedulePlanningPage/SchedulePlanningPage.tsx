import { useState } from 'react'
import { Link } from 'react-router'
import { FiCalendar, FiExternalLink } from 'react-icons/fi'
import { Button } from '../../components/Button/Button'
import { ScheduleDayTabs } from '../../components/ScheduleDayTabs/ScheduleDayTabs'
import { ScheduleDayModal } from '../../components/ScheduleDayModal/ScheduleDayModal'
import { useScheduleDayForm } from '../../components/ScheduleDayModal/useScheduleDayForm'
import { DeleteScheduleDayModal } from '../../components/DeleteScheduleDayModal/DeleteScheduleDayModal'
import { ScheduleDayActivities } from '../../components/ScheduleDayActivities/ScheduleDayActivities'
import { useScheduleActivityForm } from '../../components/ScheduleActivityForm/useScheduleActivityForm'
import { useDeleteScheduleActivity } from '../../components/DeleteScheduleActivityModal/useDeleteScheduleActivity'
import { useCurrentEventTeamsQuery } from '../../services/teams/useCurrentEventTeamsQuery'
import { useScheduleQuery } from '../../services/schedule/useScheduleQuery'
import { useDeleteScheduleDayMutation } from '../../services/schedule/useDeleteScheduleDayMutation'
import { isNoCurrentEventError } from '../../services/schedule/schedule.api'
import type { ScheduleEvent } from '../../services/schedule/schedule.types'
import { ROUTE_PATHS } from '../../constants/routePaths'
import { toastPromise } from '../../utils/toast/toast'
import {
  eventDateOptions,
  formatScheduleDay,
  formatScheduleShortDate,
} from '../../utils/scheduleDate/scheduleDate'

// "EJC 2026 · 03 abr a 05 abr · o que for salvo aqui aparece em Cronograma".
// The date range drops out when the event has no dates set.
function pageSubtitle(event: ScheduleEvent): string {
  const range =
    event.startDate && event.endDate
      ? `${formatScheduleShortDate(event.startDate)} a ${formatScheduleShortDate(event.endDate)}`
      : null

  return [event.name, range, 'o que for salvo aqui aparece em Cronograma']
    .filter(Boolean)
    .join(' · ')
}

function PageMessage(props: { message: string; tone?: 'error' }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={props.tone === 'error' ? 'text-red-600' : 'text-gray-600'}>
        {props.message}
      </div>
    </div>
  )
}

/**
 * "Planejar Cronograma": the admin builds the current event's days, one tab
 * each, and plans each day's activities below its tab.
 *
 * The selected tab is held by id and falls back to the first day, so deleting
 * the selected day lands on another without an effect to reset it.
 */
export function SchedulePlanningPage() {
  const scheduleQuery = useScheduleQuery()
  const deleteMutation = useDeleteScheduleDayMutation()

  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const dayForm = useScheduleDayForm(setSelectedDayId)
  const teamsQuery = useCurrentEventTeamsQuery()

  const days = scheduleQuery.data?.days ?? []
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0]
  const activityForm = useScheduleActivityForm(
    selectedDay ? { id: selectedDay.id, date: selectedDay.date } : null
  )
  const activityDeletion = useDeleteScheduleActivity(activityForm.close)

  if (scheduleQuery.isLoading) {
    return <PageMessage message="Carregando cronograma..." />
  }

  if (scheduleQuery.error || !scheduleQuery.data) {
    return (
      <PageMessage
        tone="error"
        message={
          isNoCurrentEventError(scheduleQuery.error)
            ? 'Nenhum encontro atual definido. Defina o encontro atual para planejar o cronograma.'
            : 'Não foi possível carregar o cronograma.'
        }
      />
    )
  }

  const { event } = scheduleQuery.data
  const teamOptions = (teamsQuery.data ?? []).map((team) => ({
    value: team.id,
    label: team.templateName,
  }))
  // Moving a day keeps its own date among the chips; only other days' dates drop out.
  const dateOptions = eventDateOptions(
    event.startDate,
    event.endDate,
    days.map((day) => day.date).filter((date) => date !== dayForm.editingDate)
  )

  const confirmDelete = () => {
    if (!selectedDay) {
      return
    }

    const pending = deleteMutation.mutateAsync(selectedDay.id).then(() => {
      setIsConfirmingDelete(false)
      setSelectedDayId(null)
    })

    toastPromise(pending, { message: 'Dia excluído com sucesso!' })
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 m-0">Planejamento de Cronograma</h1>
            <p className="mt-2 text-gray-600">{pageSubtitle(event)}</p>
          </div>
          <Link
            to={ROUTE_PATHS.SCHEDULE}
            className="inline-flex items-center gap-2 text-sm font-bold text-primary"
          >
            Ver Cronograma <FiExternalLink aria-hidden />
          </Link>
        </header>

        {selectedDay ? (
          <>
            <ScheduleDayTabs
              days={days}
              selectedDayId={selectedDay.id}
              onSelectDay={(dayId) => {
                // An open form belongs to the day it was opened on.
                activityForm.close()
                setSelectedDayId(dayId)
              }}
              onNewDay={dayForm.open}
            />

            <section className="mt-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="m-0 text-xl font-semibold text-dark-brown">
                  {formatScheduleDay(selectedDay.date)}
                </h2>
                <div className="flex items-center gap-2">
                  <Button variant="text" onClick={() => dayForm.openToEdit(selectedDay)}>
                    Editar dia
                  </Button>
                  <Button variant="text" onClick={() => setIsConfirmingDelete(true)}>
                    Excluir dia
                  </Button>
                </div>
              </div>

              <ScheduleDayActivities
                activities={selectedDay.activities}
                dayDate={selectedDay.date}
                teamOptions={teamOptions}
                form={activityForm}
                deletion={activityDeletion}
              />
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-tertiary bg-white px-6 py-12 text-center">
            <FiCalendar size={32} className="text-dark-brown" aria-hidden />
            <h2 className="m-0 text-lg font-semibold text-dark-brown">Nenhum dia no cronograma</h2>
            <p className="m-0 max-w-md text-sm text-gray-600">
              Comece criando o primeiro dia do evento. Depois, adicione as atividades uma abaixo da
              outra.
            </p>
            <Button onClick={dayForm.open}>Criar primeiro dia</Button>
          </div>
        )}
      </div>

      <ScheduleDayModal
        open={dayForm.isOpen}
        onClose={dayForm.close}
        mode={dayForm.mode}
        dateOptions={dateOptions}
        date={dayForm.date}
        onDateChange={dayForm.setDate}
        minDate={event.startDate ?? undefined}
        maxDate={event.endDate ?? undefined}
        error={dayForm.error}
        onSubmit={dayForm.submit}
        isSubmitting={dayForm.isSubmitting}
      />

      {selectedDay && (
        <DeleteScheduleDayModal
          open={isConfirmingDelete}
          dayLabel={formatScheduleDay(selectedDay.date)}
          activityCount={selectedDay.activityCount}
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={confirmDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  )
}
