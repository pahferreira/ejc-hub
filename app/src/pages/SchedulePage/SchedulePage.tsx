import { useEffect, useState } from 'react'
import { isAxiosError } from 'axios'
import { usePostHog } from '@posthog/react'
import { FiCalendar } from 'react-icons/fi'
import { ScheduleDayCard } from '../../components/ScheduleDayCard/ScheduleDayCard'
import { ScheduleTimelineRow } from '../../components/ScheduleTimelineRow/ScheduleTimelineRow'
import { useScheduleQuery } from '../../services/schedule/useScheduleQuery'
import { isNoCurrentEventError } from '../../services/schedule/schedule.api'
import { useCurrentEventSubscriptionStatusQuery } from '../../services/events/useCurrentEventSubscriptionStatusQuery'
import { pluralize } from '../../utils/pluralize/pluralize'
import {
  defaultDayTab,
  groupActivitiesByPeriod,
  scheduleViewerRole,
} from '../../utils/scheduleTimeline/scheduleTimeline'

const SCHEDULE_VIEWED_EVENT = 'schedule_viewed'

function PageMessage(props: { message: string; tone?: 'error' }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className={props.tone === 'error' ? 'text-red-600' : 'text-gray-600'}>
        {props.message}
      </div>
    </div>
  )
}

function errorMessage(error: unknown): string {
  if (isNoCurrentEventError(error)) {
    return 'Nenhum encontro atual definido.'
  }

  if (isAxiosError(error) && error.response?.status === 403) {
    return 'O cronograma é exclusivo para as equipes do encontro atual.'
  }

  return 'Não foi possível carregar o cronograma.'
}

/**
 * "Cronograma": the current event's schedule, read-only, for everyone on a team
 * and for the admins. One tab per day, opening on today during the event, with
 * the day's activities grouped into Manhã, Tarde and Noite and the viewer's
 * team's rows highlighted.
 *
 * The selected tab is held by id and falls back to `defaultDayTab`, so the page
 * opens on the right day without an effect to set it once the data arrives.
 */
export function SchedulePage() {
  const scheduleQuery = useScheduleQuery()
  const subscriptionStatus = useCurrentEventSubscriptionStatusQuery()
  const posthog = usePostHog()
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)

  const days = scheduleQuery.data?.days ?? []
  const selectedDay =
    days.find((day) => day.id === selectedDayId) ??
    days.find((day) => day.id === defaultDayTab(days, new Date()))
  // Only once the membership has loaded: a failed request must not report a
  // team member as `admin`.
  const role = subscriptionStatus.data
    ? scheduleViewerRole(subscriptionStatus.data.myMembershipType)
    : null

  const selectedDate = selectedDay?.date

  // Fired whenever a day's tab is shown: on opening and on every switch. Waits
  // for the membership so the role is never reported before it is known.
  useEffect(() => {
    if (selectedDate && role) {
      posthog.capture(SCHEDULE_VIEWED_EVENT, { day: selectedDate, role })
    }
  }, [posthog, selectedDate, role])

  if (scheduleQuery.isLoading) {
    return <PageMessage message="Carregando cronograma..." />
  }

  if (scheduleQuery.error || !scheduleQuery.data) {
    return <PageMessage tone="error" message={errorMessage(scheduleQuery.error)} />
  }

  const { event, myTeamInstanceId } = scheduleQuery.data

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-8xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 m-0">Cronograma</h1>
          <p className="mt-2 text-gray-600">{event.name} · a programação de cada dia do encontro</p>
        </header>

        {selectedDay ? (
          <>
            <div role="tablist" aria-label="Dias do cronograma" className="flex flex-wrap gap-3">
              {days.map((day, index) => (
                <ScheduleDayCard
                  key={day.id}
                  dayNumber={index + 1}
                  date={day.date}
                  isSelected={day.id === selectedDay.id}
                  onSelect={() => setSelectedDayId(day.id)}
                />
              ))}
            </div>

            <section role="tabpanel" className="mt-8">
              <h2 className="m-0 text-xl font-semibold text-dark-brown">Linha do tempo</h2>
              <p className="mt-1 text-sm text-gray-600">
                {pluralize(
                  selectedDay.activities.length,
                  `${selectedDay.activities.length} atividade`,
                  `${selectedDay.activities.length} atividades`
                )}
              </p>

              {groupActivitiesByPeriod(selectedDay.activities, selectedDay.date).map((group) => (
                <div key={group.period} className="mt-6">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-primary">
                    {group.label}
                  </h3>
                  <ol className="m-0 list-none p-0">
                    {group.activities.map((activity) => (
                      <ScheduleTimelineRow
                        key={activity.id}
                        activity={activity}
                        myTeamInstanceId={myTeamInstanceId}
                      />
                    ))}
                  </ol>
                </div>
              ))}
            </section>
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-tertiary bg-white px-6 py-12 text-center">
            <FiCalendar size={32} className="text-dark-brown" aria-hidden />
            <h2 className="m-0 text-lg font-semibold text-dark-brown">
              O cronograma ainda não está pronto
            </h2>
            <p className="m-0 max-w-md text-sm text-gray-600">
              Os dias e as atividades do encontro aparecem aqui assim que forem planejados.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
