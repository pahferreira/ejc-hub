import { FiUserX } from 'react-icons/fi'
import type { TeamOverview } from '../../services/teams/teams.types'
import { getTeamStatus, teamStatusDisplay } from './teamStatus'
import { Badge } from '../Badge/Badge'
import { Button } from '../Button/Button'

export type TeamHealthCardProps = {
  team: TeamOverview
  onAdd?: () => void
  onAssignCoordinator?: () => void
}

function getInitials(name: string) {
  const [first = '', second = ''] = name.trim().split(/\s+/)
  return ((first[0] ?? '') + (second[0] ?? '')).toUpperCase() || '?'
}

function calculatePercentage(current: number, max: number) {
  if (max <= 0) {
    return 0
  }
  return Math.min(100, Math.round((current / max) * 100))
}

export function TeamHealthCard(props: TeamHealthCardProps) {
  const status = getTeamStatus(props.team.memberCount, props.team.maxCapacity)
  const statusDisplay = teamStatusDisplay[status]
  const remaining = Math.max(0, props.team.maxCapacity - props.team.memberCount)
  const isFull = remaining === 0
  const statusFillClass =
    status === 'needsMembers' ? 'bg-red' : status === 'spotsAvailable' ? 'bg-blue' : 'bg-green'

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-md border border-tertiary">
      <div className={`h-1.5 ${statusFillClass}`} aria-hidden />
      <div className="flex flex-1 flex-col gap-4 px-6 py-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 font-serif text-xl text-dark-brown">{props.team.templateName}</h3>
          <Badge variant={statusDisplay.badgeVariant}>{statusDisplay.label}</Badge>
        </div>

        {props.team.templateDescription && (
          <p className="m-0 text-sm text-secondary-foreground">{props.team.templateDescription}</p>
        )}

        {props.team.coordinators.length > 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex shrink-0 -space-x-2">
              {props.team.coordinators.map((coordinator) => (
                <div
                  key={coordinator.id}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-dark-brown text-sm font-semibold text-white"
                  aria-hidden
                >
                  {getInitials(coordinator.name)}
                </div>
              ))}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="text-xs uppercase font-semibold tracking-wider text-secondary">
                Coordenadores
              </span>
              <span className="truncate text-sm font-medium text-black">
                {props.team.coordinators.length === 1
                  ? props.team.coordinators[0].name
                  : props.team.coordinators.map((c) => c.name.split(/\s+/)[0]).join(', ')}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-red/60 bg-red/5 px-3 py-2">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-red/60 text-red"
                aria-hidden
              >
                <FiUserX size={16} />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs uppercase font-semibold tracking-wider text-red">
                  Sem coordenação
                </span>
                <span className="truncate text-sm font-medium text-black">
                  Nenhum coordenador atribuído
                </span>
              </div>
            </div>
            {props.onAssignCoordinator && (
              <Button onClick={props.onAssignCoordinator}>Atribuir</Button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-sm text-black">
            <span className="font-medium">Membros</span>
            <span className="font-medium tabular-nums">
              {props.team.memberCount} / {props.team.maxCapacity}
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="Membros"
            aria-valuenow={props.team.memberCount}
            aria-valuemin={0}
            aria-valuemax={props.team.maxCapacity}
            className="h-2 w-full overflow-hidden rounded-full bg-gray-200"
          >
            <div
              className={`h-full rounded-full transition-all ${statusFillClass}`}
              style={{
                width: `${calculatePercentage(props.team.memberCount, props.team.maxCapacity)}%`,
              }}
            />
          </div>
          <span className="text-xs text-dark-brown/70">
            <strong className="font-semibold">{remaining}</strong> vagas restantes
          </span>
        </div>

        <div className="mt-auto flex flex-col">
          <Button onClick={props.onAdd} disabled={isFull}>
            + Adicionar
          </Button>
        </div>
      </div>
    </section>
  )
}
