import { Schedule } from '../core/Schedule.ts'
import { eventRepository } from '../../../modules/event/repository/DrizzleEventRepository.ts'
import { scheduleDayRepository } from '../../../modules/schedule-day/repository/DrizzleScheduleDayRepository.ts'

export const scheduleApp = new Schedule(eventRepository, scheduleDayRepository)
