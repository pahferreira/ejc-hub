import { describe, it, expect } from 'vitest'
import { computeDayForecast } from './computeDayForecast'
import { toEventInstant } from './toEventInstant'
import { toEventTime } from './toEventTime'
import type { ForecastActivity, ForecastedActivity } from './schedule.types'

const DAY = '2026-11-14'
/** A São Paulo clock time on the test day, as an instant. */
const at = (time: string, date = DAY) => toEventInstant(date, time)

const planned = (id: string, start: string, durationMinutes: number): ForecastActivity => ({
  id,
  status: 'planned',
  plannedStartsAt: at(start),
  durationMinutes,
  adjustedDurationMinutes: null,
})

const running = (activity: ForecastActivity, actualStart: string): ForecastActivity => ({
  ...activity,
  status: 'running',
  actualStartsAt: at(actualStart),
})

const done = (
  activity: ForecastActivity,
  actualStart: string,
  actualEnd: string
): ForecastActivity => ({
  ...activity,
  status: 'done',
  actualStartsAt: at(actualStart),
  actualEndsAt: at(actualEnd),
})

const skipped = (activity: ForecastActivity): ForecastActivity => ({
  ...activity,
  status: 'skipped',
})

const trimmed = (activity: ForecastActivity, minutes: number): ForecastActivity => ({
  ...activity,
  adjustedDurationMinutes: minutes,
})

/** Each activity's id with its forecast start and end, as São Paulo HH:mm. */
const times = (activities: ForecastedActivity[]) =>
  activities.map((activity) => [
    activity.id,
    toEventTime(activity.forecastStartsAt),
    toEventTime(activity.forecastEndsAt),
  ])

describe('computeDayForecast', () => {
  it('returns no activities, no drift and nothing running or next for an empty day', () => {
    expect(computeDayForecast({ activities: [] }, at('09:00'))).toEqual({
      activities: [],
      driftMinutes: 0,
      running: null,
      next: null,
    })
  })

  it('forecasts an untouched day exactly as planned, gaps kept, and points at the first activity', () => {
    const forecast = computeDayForecast(
      { activities: [planned('b', '10:00', 30), planned('a', '08:00', 60)] },
      at('07:00')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:00', '09:00'],
      ['b', '10:00', '10:30'],
    ])
    expect(forecast.driftMinutes).toBe(0)
    expect(forecast.running).toBeNull()
    expect(forecast.next?.id).toBe('a')
  })

  it('pushes the rest of the day by a late start', () => {
    const forecast = computeDayForecast(
      {
        activities: [
          running(planned('a', '08:00', 60), '08:15'),
          planned('b', '09:00', 30),
          planned('c', '10:00', 30),
        ],
      },
      at('08:20')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:15', '09:15'],
      ['b', '09:15', '09:45'],
      ['c', '10:15', '10:45'],
    ])
    expect(forecast.driftMinutes).toBe(15)
    expect(forecast.running?.id).toBe('a')
    expect(forecast.next?.id).toBe('b')
  })

  it('grows a live overrun with now, pushing what follows', () => {
    const day = {
      activities: [running(planned('a', '08:00', 60), '08:00'), planned('b', '09:00', 30)],
    }

    const onTime = computeDayForecast(day, at('08:50'))
    expect(times(onTime.activities)).toEqual([
      ['a', '08:00', '09:00'],
      ['b', '09:00', '09:30'],
    ])
    expect(onTime.driftMinutes).toBe(0)

    const overrun = computeDayForecast(day, at('09:10'))
    expect(times(overrun.activities)).toEqual([
      ['a', '08:00', '09:10'],
      ['b', '09:10', '09:40'],
    ])
    expect(overrun.driftMinutes).toBe(10)
  })

  it('ends a trimmed running activity at its adjusted length, pulling the next one earlier', () => {
    const forecast = computeDayForecast(
      {
        activities: [
          running(trimmed(planned('a', '08:00', 60), 40), '08:00'),
          planned('b', '09:00', 30),
        ],
      },
      at('08:10')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:00', '08:40'],
      ['b', '08:40', '09:10'],
    ])
    expect(forecast.driftMinutes).toBe(-20)
  })

  it('takes a done activity at its actual times and pulls the day earlier when it finished early', () => {
    const forecast = computeDayForecast(
      {
        activities: [done(planned('a', '08:00', 60), '08:00', '08:45'), planned('b', '09:00', 30)],
      },
      at('08:50')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:00', '08:45'],
      ['b', '08:45', '09:15'],
    ])
    expect(forecast.driftMinutes).toBe(-15)
    expect(forecast.running).toBeNull()
    expect(forecast.next?.id).toBe('b')
  })

  it('reports the final drift and nothing running or next once the whole day is done', () => {
    const forecast = computeDayForecast(
      {
        activities: [
          done(planned('a', '08:00', 60), '08:05', '09:10'),
          done(planned('b', '09:00', 30), '09:10', '09:45'),
        ],
      },
      at('12:00')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:05', '09:10'],
      ['b', '09:10', '09:45'],
    ])
    expect(forecast.driftMinutes).toBe(15)
    expect(forecast.running).toBeNull()
    expect(forecast.next).toBeNull()
  })

  it('gives a skipped activity zero time, dropping the drift by its length', () => {
    const forecast = computeDayForecast(
      {
        activities: [
          done(planned('a', '08:00', 60), '08:00', '09:20'),
          skipped(planned('b', '09:00', 30)),
          planned('c', '09:30', 30),
        ],
      },
      at('09:20')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:00', '09:20'],
      ['b', '09:20', '09:20'],
      ['c', '09:20', '09:50'],
    ])
    expect(forecast.driftMinutes).toBe(-10)
    expect(forecast.next?.id).toBe('c')
  })

  it('pulls the activities after a trimmed upcoming one earlier, without touching the current drift', () => {
    const forecast = computeDayForecast(
      {
        activities: [
          running(planned('a', '08:00', 60), '08:10'),
          trimmed(planned('b', '09:00', 60), 30),
          planned('c', '10:00', 30),
        ],
      },
      at('08:30')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:10', '09:10'],
      ['b', '09:10', '09:40'],
      ['c', '09:40', '10:10'],
    ])
    expect(forecast.driftMinutes).toBe(10)
  })

  it('keeps the planned gaps between activities instead of closing them up', () => {
    const forecast = computeDayForecast(
      {
        activities: [
          done(planned('a', '08:00', 30), '08:00', '08:40'),
          planned('b', '09:00', 30),
          planned('c', '11:00', 30),
        ],
      },
      at('08:40')
    )

    expect(times(forecast.activities)).toEqual([
      ['a', '08:00', '08:40'],
      ['b', '09:10', '09:40'],
      ['c', '11:10', '11:40'],
    ])
  })

  it('carries the drift past midnight on the same schedule day', () => {
    const nextDate = '2026-11-15'
    const forecast = computeDayForecast(
      {
        activities: [
          running(planned('a', '23:30', 60), '23:45'),
          { ...planned('b', '00:30', 30), plannedStartsAt: at('00:30', nextDate) },
        ],
      },
      at('23:50')
    )

    const [a, b] = forecast.activities
    expect(a.forecastEndsAt).toEqual(at('00:45', nextDate))
    expect(b.forecastStartsAt).toEqual(at('00:45', nextDate))
    expect(b.forecastEndsAt).toEqual(at('01:15', nextDate))
    expect(forecast.driftMinutes).toBe(15)
  })

  it('starts each day at zero drift, whatever the day before ended at', () => {
    const lateDay = computeDayForecast(
      { activities: [done(planned('a', '21:00', 60), '21:30', '22:30')] },
      at('23:00')
    )
    expect(lateDay.driftMinutes).toBe(30)

    const nextDate = '2026-11-15'
    const nextDay = computeDayForecast(
      { activities: [{ ...planned('b', '08:00', 60), plannedStartsAt: at('08:00', nextDate) }] },
      at('07:00', nextDate)
    )
    expect(nextDay.activities[0].forecastStartsAt).toEqual(at('08:00', nextDate))
    expect(nextDay.driftMinutes).toBe(0)
  })
})
