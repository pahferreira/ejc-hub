import { FiCalendar } from 'react-icons/fi'
import { hasPermission, SchedulePermissions } from '../../../../common/permissions'
import { ScheduleDayCard } from '../../components/ScheduleDayCard/ScheduleDayCard'
import { ScheduleHappeningNowCard } from '../../components/ScheduleHappeningNowCard/ScheduleHappeningNowCard'
import { ScheduleNextActivityCard } from '../../components/ScheduleNextActivityCard/ScheduleNextActivityCard'
import { ScheduleNoteModal } from '../../components/ScheduleNoteModal/ScheduleNoteModal'
import { useScheduleNoteForm } from '../../components/ScheduleNoteModal/useScheduleNoteForm'
import { ScheduleTimelineRow } from '../../components/ScheduleTimelineRow/ScheduleTimelineRow'
import { useAuthentication } from '../../hooks/useAuthentication'
import { FeatureFlag } from '../../hooks/useFeatureFlag/feature-flags'
import { useFeatureFlag } from '../../hooks/useFeatureFlag/useFeatureFlag'
import { useScheduleQuery } from '../../services/schedule/useScheduleQuery'
import {
  isNoCurrentEventError,
  isScheduleForbiddenError,
} from '../../services/schedule/schedule.api'
import { pluralize } from '../../utils/pluralize/pluralize'
import {
  activityControls,
  doneActivityCount,
  nextPlannedActivity,
  runningActivity,
} from '../../utils/scheduleLive/scheduleLive'
import { groupActivitiesByPeriod } from '../../utils/scheduleTimeline/scheduleTimeline'
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
 * activity (or the next one when nothing runs), each row's status, the days'
 * "Concluído n/m", and the clock controls for whoever holds `schedule:control`.
 * Admins and coordinators leave Observações on any activity; each row shows the
 * notes the API lets the viewer read.
 */
export function SchedulePage() {
  const scheduleQuery = useScheduleQuery()
  const days = scheduleQuery.data?.days ?? []
  const { selectedDay, selectDay } = useSelectedScheduleDay(days)
  const { permissions } = useAuthentication()
  const { isFeatureEnabled } = useFeatureFlag()
  const controls = useScheduleControls()
  const noteForm = useScheduleNoteForm()

  const isLive = isFeatureEnabled(FeatureFlag.ScheduleLive, false)
  const canControl = isLive && hasPermission(permissions, SchedulePermissions.Control)

  useScheduleViewedTracking(selectedDay?.date, scheduleQuery.data?.viewerRole)

  if (scheduleQuery.isLoading) {
    return <PageMessage message="Carregando cronograma..." />
  }

  if (scheduleQuery.error || !scheduleQuery.data) {
    return <PageMessage tone="error" message={errorMessage(scheduleQuery.error)} />
  }

  const { event, myTeamInstanceId, viewerRole } = scheduleQuery.data
  // The API's write rule: whoever runs the clock writes as an admin, and a
  // coordinator of the current event writes for their team.
  const canWriteNotes = isLive && (canControl || viewerRole === 'coordinator')
  // One activity runs per event, so the running one shows whichever day is
  // selected (a night activity can run past midnight into the next day's tab).
  // Iniciar follows the selected day: activities start in order within their day.
  const eventActivities = days.flatMap((day) => day.activities)
  const running = isLive ? runningActivity(eventActivities) : null
  const next = isLive && selectedDay ? nextPlannedActivity(selectedDay.activities) : null
  const nextAfterRunning = running
    ? nextPlannedActivity(eventActivities.slice(eventActivities.indexOf(running) + 1))
    : null

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

            {running && (
              <div className="mt-8">
                <ScheduleHappeningNowCard
                  activity={running}
                  next={nextAfterRunning}
                  myTeamInstanceId={myTeamInstanceId}
                  onFinish={canControl ? () => controls.finish(running) : undefined}
                  isControlPending={controls.isPending}
                />
              </div>
            )}
            {!running && next && (
              <div className="mt-8">
                <ScheduleNextActivityCard
                  activity={next}
                  myTeamInstanceId={myTeamInstanceId}
                  onStart={canControl ? () => controls.start(next) : undefined}
                  isControlPending={controls.isPending}
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
                        live={isLive}
                        controls={activityControls(activity, next?.id ?? null, canControl)}
                        onStart={() => controls.start(activity)}
                        onFinish={() => controls.finish(activity)}
                        isControlPending={controls.isPending}
                        onAddNote={canWriteNotes ? () => noteForm.open(activity) : undefined}
                      />
                    ))}
                  </ol>
                </div>
              ))}
            </section>

            <ScheduleNoteModal
              open={noteForm.isOpen}
              onClose={noteForm.close}
              activityTitle={noteForm.activityTitle}
              body={noteForm.body}
              onBodyChange={noteForm.setBody}
              error={noteForm.error}
              onSubmit={noteForm.submit}
              isSubmitting={noteForm.isSubmitting}
            />
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
