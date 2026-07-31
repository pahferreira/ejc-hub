export type WeekAvailabilityProps = {
  /** Days of the week the person is available (e.g. ["monday", "friday"]). Renders nothing when empty/absent. */
  weekAvailability?: string[]
}

const WEEK_DAYS = [
  { key: 'monday', label: 'S' },
  { key: 'tuesday', label: 'T' },
  { key: 'wednesday', label: 'Q' },
  { key: 'thursday', label: 'Q' },
  { key: 'friday', label: 'S' },
  { key: 'saturday', label: 'S' },
  { key: 'sunday', label: 'D' },
]

export function WeekAvailability(props: WeekAvailabilityProps) {
  const hasWeekAvailability = (props.weekAvailability?.length ?? 0) > 0

  if (!hasWeekAvailability) {
    return null
  }

  const availabilitySet = new Set(props.weekAvailability ?? [])

  return (
    <div className="flex gap-0.5">
      {WEEK_DAYS.map((day) => (
        <span
          key={day.key}
          className={`flex size-4 items-center justify-center rounded-full text-[10px] font-semibold ${
            availabilitySet.has(day.key)
              ? 'bg-dark-brown text-white'
              : 'bg-secondary text-secondary-foreground opacity-40'
          }`}
        >
          {day.label}
        </span>
      ))}
    </div>
  )
}
