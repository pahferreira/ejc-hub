import { getInitials } from '../TeamAvatar/getInitials'
import { ProgressBar } from '../ProgressBar/ProgressBar'
import { StatBlock } from '../StatBlock/StatBlock'

export type TeamDetailHeaderCardProps = {
  /** Team name. Shown in serif and used to derive the initials tile. */
  name: string
  /** Optional description line under the team name. Hidden when absent. */
  description?: string
  /** Current number of members assigned to the team. */
  memberCount: number
  /** Maximum capacity of the team. */
  maxCapacity: number
  /** Number of remaining open slots. */
  freeSlots: number
  /** Percentage (0-100) of slots filled, shown on the progress bar. */
  filledPercentage: number
}

export function TeamDetailHeaderCard(props: TeamDetailHeaderCardProps) {
  const initials = getInitials(props.name)

  return (
    <section className="overflow-hidden rounded-xl border border-tertiary bg-white shadow-md">
      <div className="h-1.5 bg-dark-brown" aria-hidden />

      <div className="flex flex-col gap-5 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-dark-brown text-lg font-semibold text-white"
            >
              {initials}
            </span>
            <div className="flex min-w-0 flex-col gap-1">
              <h2 className="m-0 font-serif text-2xl text-dark-brown">{props.name}</h2>
              {props.description && (
                <p className="m-0 text-sm text-secondary-foreground">{props.description}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 gap-2 md-gap-8">
            <StatBlock value={props.memberCount} label="Membros" />
            <StatBlock value={props.maxCapacity} label="Capacidade" />
            <StatBlock value={props.freeSlots} label="Vagas livres" />
          </div>
        </div>

        <ProgressBar
          label="Vagas preenchidas"
          value={props.filledPercentage}
          max={100}
          rightLabel="percentage"
          showPercentageLine={false}
        />
      </div>
    </section>
  )
}
