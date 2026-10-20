import { FiBookOpen, FiCalendar, FiDollarSign, FiMapPin, FiMusic, FiStar } from 'react-icons/fi'
import { formatCurrency } from '../../utils/formatCurrency/formatCurrency'
import { EventBannerInfoItem } from '../EventBannerInfoItem/EventBannerInfoItem'

export type EventBannerProps = {
  name: string
  description: string
  startsAt: string | null
  endsAt: string | null
  location: string | null
  song: string | null
  theme: string | null
  biblePassage: string | null
  /** Subscription fee in cents. 0 means no fee is set and hides the Taxa block. */
  feeAmountCents: number
  feeCurrency: string
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
  const feeLabel =
    props.feeAmountCents > 0 ? formatCurrency(props.feeAmountCents, props.feeCurrency) : null

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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-12 lg:gap-y-6 3xl:grid-cols-6">
          {props.theme && <EventBannerInfoItem icon={FiStar} label="Tema" value={props.theme} />}
          {props.biblePassage && (
            <EventBannerInfoItem
              icon={FiBookOpen}
              label="Passagem Bíblica"
              value={props.biblePassage}
            />
          )}
          {props.song && <EventBannerInfoItem icon={FiMusic} label="Música" value={props.song} />}
          <EventBannerInfoItem icon={FiCalendar} label="Data" value={dateLabel} />
          {props.location && (
            <EventBannerInfoItem icon={FiMapPin} label="Local" value={props.location} />
          )}
          {feeLabel && <EventBannerInfoItem icon={FiDollarSign} label="Taxa" value={feeLabel} />}
        </div>
      </div>
    </section>
  )
}
