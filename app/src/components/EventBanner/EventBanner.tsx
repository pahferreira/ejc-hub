import { FiCalendar, FiMapPin } from 'react-icons/fi'

export type EventBannerProps = {
  name: string
  description: string
  startsAt: string | null
  endsAt: string | null
  location: string | null
}

const monthFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatSingleDate(iso: string) {
  const date = new Date(iso)
  const month = capitalize(monthFormatter.format(date))
  return `${date.getDate()} de ${month}, ${date.getFullYear()}`
}

function formatEventDates(startsAt: string | null, endsAt: string | null): string {
  if (!startsAt && !endsAt) return 'Datas a definir'
  if (startsAt && !endsAt) return formatSingleDate(startsAt)
  if (!startsAt && endsAt) return formatSingleDate(endsAt)

  const start = new Date(startsAt as string)
  const end = new Date(endsAt as string)

  const sameYear = start.getFullYear() === end.getFullYear()
  const sameMonth = sameYear && start.getMonth() === end.getMonth()
  const sameDay = sameMonth && start.getDate() === end.getDate()

  if (sameDay) {
    return formatSingleDate(startsAt as string)
  }

  if (sameMonth) {
    const month = capitalize(monthFormatter.format(start))
    return `${start.getDate()}-${end.getDate()} de ${month}, ${start.getFullYear()}`
  }

  if (sameYear) {
    const startMonth = capitalize(monthFormatter.format(start))
    const endMonth = capitalize(monthFormatter.format(end))
    return `${start.getDate()} de ${startMonth} - ${end.getDate()} de ${endMonth}, ${start.getFullYear()}`
  }

  return `${formatSingleDate(startsAt as string)} - ${formatSingleDate(endsAt as string)}`
}

export function EventBanner(props: EventBannerProps) {
  const dateLabel = formatEventDates(props.startsAt, props.endsAt)

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-dark-brown to-primary px-6 py-8 text-white sm:px-10 sm:py-10">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-white/5"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 font-serif text-3xl font-bold sm:text-4xl">{props.name}</h2>
          <p className="m-0 text-white/80">{props.description}</p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
              <FiCalendar size={18} aria-hidden />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white/70">Data</span>
              <span className="text-sm font-semibold">{dateLabel}</span>
            </div>
          </div>

          {props.location && (
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <FiMapPin size={18} aria-hidden />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/70">Local</span>
                <span className="text-sm font-semibold">{props.location}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
