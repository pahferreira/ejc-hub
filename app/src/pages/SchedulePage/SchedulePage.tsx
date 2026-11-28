import { FiCalendar } from 'react-icons/fi'
import { hasPermission, SchedulePermissions } from '../../../../common/permissions'
import { ScheduleDayCard } from '../../components/ScheduleDayCard/ScheduleDayCard'
import { ScheduleDriftChip } from '../../components/ScheduleDriftChip/ScheduleDriftChip'
import { ScheduleHappeningNowCard } from '../../components/ScheduleHappeningNowCard/ScheduleHappeningNowCard'
import { ScheduleNextActivityCard } from '../../components/ScheduleNextActivityCard/ScheduleNextActivityCard'
import { ScheduleTimelineLegend } from '../../components/ScheduleTimelineLegend/ScheduleTimelineLegend'
import { ScheduleTimelineRow } from '../../components/ScheduleTimelineRow/ScheduleTimelineRow'
import { useAuthentication } from '../../hooks/useAuthentication'
import { FeatureFlag } from '../../hooks/useFeatureFlag/feature-flags'
import { useFeatureFlag } from '../../hooks/useFeatureFlag/useFeatureFlag'
import {
  isNoCurrentEventError,
  isScheduleForbiddenError,
} from '../../services/schedule/schedule.api'
import { pluralize } from '../../utils/pluralize/pluralize'
import { driftTone, formatDayDrift } from '../../utils/scheduleClock/scheduleClock'
import {
  activityControls,
  doneActivityCount,
  forecastSchedule,
  nextPlannedActivity,
  runningActivity,
  teamNextActivity,
} from '../../utils/scheduleLive/scheduleLive'
import { groupActivitiesByPeriod } from '../../utils/scheduleTimeline/scheduleTimeline'
import { useScheduleClock } from './useScheduleClock'
import { useScheduleControls } from './useScheduleControls'
import { useSelectedScheduleDay } from './useSelectedScheduleDay'
import { useScheduleViewedTracking } from './useScheduleViewedTracking'

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

  if (isScheduleForbiddenError(error)) {
    return 'O cronograma é exclusivo para as equipes do encontro atual.'
  }

  return 'Não foi possível carregar o cronograma.'
}

/**
 * "Cronograma": the current event's schedule for everyone on a team and for
 * the admins. One tab per day, opening on today during the event, with the
 * day's activities grouped into Manhã, Tarde and Noite and the viewer's team's
 * rows highlighted.
 *
 * Behind `ScheduleLive`, the Running Schedule: a top slot with the running
 * activity and its live timer (or the next one when nothing runs), the
 * viewer's team's next activity, the day's Atraso, each row's status and
 * Previsão, the days' "Concluído n/m", and the clock controls for whoever
 * holds `schedule:control`. The clock ticks every second on the server's time
 * and the page refetches every minute.
 */
export function SchedulePage() {
  const { isFeatureEnabled } = useFeatureFlag()
  const isLive = isFeatureEnabled(FeatureFlag.ScheduleLive, false)
  const { query: scheduleQuery, now } = useScheduleClock(isLive)
  const days = scheduleQuery.data?.days ?? []
  const { selectedDay, selectDay } = useSelectedScheduleDay(days)
  const { permissions } = useAuthentication()
  const controls = useScheduleControls()

  const canControl = isLive && hasPermission(permissions, SchedulePermissions.Control)

  useScheduleViewedTracking(selectedDay?.date, scheduleQuery.data?.viewerRole)

  if (scheduleQuery.isLoading) {
    return <PageMessage message="Carregando cronograma..." />
  }

  if (scheduleQuery.error || !scheduleQuery.data) {
    return <PageMessage tone="error" message={errorMessage(scheduleQuery.error)} />
  }

  const { event, myTeamInstanceId } = scheduleQuery.data
  // One activity runs per event, so the running one shows whichever day is
  // selected (a night activity can run past midnight into the next day's tab).
  // Iniciar follows the selected day: activities start in order within their day.
  const eventActivities = days.flatMap((day) => day.activities)
  const running = isLive ? runningActivity(eventActivities) : null
  const next = isLive && selectedDay ? nextPlannedActivity(selectedDay.activities) : null
  const nextAfterRunning = running
    ? nextPlannedActivity(eventActivities.slice(eventActivities.indexOf(running) + 1))
    : null
  const forecast = isLive ? forecastSchedule(days, now) : null
  const forecastOf = (activityId: string) => forecast?.byActivityId.get(activityId)
  const teamNext = isLive
    ? teamNextActivity(eventActivities, running ? nextAfterRunning : next, myTeamInstanceId)
    : null
  const dayDriftMinutes = selectedDay
    ? forecast?.driftMinutesByDayId.get(selectedDay.id)
    : undefined

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
                  onSelect={() => selectDay(day.id)}
                  progress={
                    isLive
                      ? { done: doneActivityCount(day.activities), total: day.activities.length }
                      : undefined
                  }
                />
              ))}
            </div>

            {dayDriftMinutes !== undefined && (
              <div className="mt-6">
                <ScheduleDriftChip tone={driftTone(dayDriftMinutes)}>
                  {formatDayDrift(dayDriftMinutes)}
                </ScheduleDriftChip>
              </div>
            )}

            {running && (
              <div className="mt-6">
                <ScheduleHappeningNowCard
                  activity={running}
                  now={now}
                  next={nextAfterRunning}
                  nextForecastStartsAt={
                    nextAfterRunning ? forecastOf(nextAfterRunning.id)?.forecastStartsAt : undefined
                  }
                  myTeamInstanceId={myTeamInstanceId}
                  onFinish={canControl ? () => controls.finish(running) : undefined}
                  isControlPending={controls.isPending}
                />
              </div>
            )}
            {!running && next && (
              <div className="mt-6">
                <ScheduleNextActivityCard
                  activity={next}
                  forecastStartsAt={
                    forecastOf(next.id)?.forecastStartsAt ?? new Date(next.plannedStartsAt)
                  }
                  now={now}
                  myTeamInstanceId={myTeamInstanceId}
                  onStart={canControl ? () => controls.start(next) : undefined}
                  isControlPending={controls.isPending}
                />
              </div>
            )}

            {teamNext && (
              <div className="mt-4">
                <ScheduleNextActivityCard
                  forMyTeam
                  activity={teamNext}
                  forecastStartsAt={
                    forecastOf(teamNext.id)?.forecastStartsAt ?? new Date(teamNext.plannedStartsAt)
                  }
                  now={now}
                  myTeamInstanceId={myTeamInstanceId}
                />
              </div>
            )}

            <section role="tabpanel" className="mt-8">
              <h2 className="m-0 text-xl font-semibold text-dark-brown">Linha do tempo</h2>
              <p className="mt-1 text-sm text-gray-600">
                {pluralize(
                  selectedDay.activities.length,
                  `${selectedDay.activities.length} atividade`,
                  `${selectedDay.activities.length} atividades`
                )}
                {isLive && ' · atrasos se propagam em cascata'}
              </p>
              {isLive && (
                <div className="mt-3">
                  <ScheduleTimelineLegend />
                </div>
              )}

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
                        live={isLive}
                        forecast={
                          activity.status === 'planned' || activity.status === 'running'
                            ? forecastOf(activity.id)
                            : undefined
                        }
                        controls={activityControls(activity, next?.id ?? null, canControl)}
                        onStart={() => controls.start(activity)}
                        onFinish={() => controls.finish(activity)}
                        isControlPending={controls.isPending}
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
