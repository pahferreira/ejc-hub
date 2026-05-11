import { FiAlertCircle, FiArrowRight, FiClock, FiUsers } from 'react-icons/fi'
import { Button } from '../Button/Button'
import { CoordinatorRow } from '../CoordinatorRow/CoordinatorRow'
import { Pill } from '../Pill/Pill'

type TeamCoordinator = {
  id: string
  name: string
  phone: string | null
}

type TeamPreference = {
  key: string
  name: string
}

type AssignedVariantProps = {
  variant: 'assigned'
  team: {
    id: string
    name: string
    description: string | null
    coordinators: TeamCoordinator[]
  }
  onViewProfile?: () => void
}

type PendingVariantProps = {
  variant: 'pending'
  preferences: TeamPreference[]
  onViewTeams?: () => void
}

type WaitingListVariantProps = {
  variant: 'waitingList'
  preferences: TeamPreference[]
  onViewWaitingList?: () => void
}

export type TeamCardProps = AssignedVariantProps | PendingVariantProps | WaitingListVariantProps

const containerBaseClasses = 'overflow-hidden rounded-xl bg-white shadow-md'
const containerByVariant: Record<TeamCardProps['variant'], string> = {
  assigned: 'border border-tertiary',
  pending: 'border-2 border-blue',
  waitingList: 'border-2 border-blue',
}

export function TeamCard(props: TeamCardProps) {
  return (
    <section className={`${containerBaseClasses} ${containerByVariant[props.variant]}`}>
      <Header variant={props.variant} />
      <div className="flex flex-col gap-5 px-6 py-4">
        {props.variant === 'assigned' && <AssignedBody {...props} />}
        {props.variant === 'pending' && <PendingBody {...props} />}
        {props.variant === 'waitingList' && <WaitingListBody {...props} />}
      </div>
    </section>
  )
}

function Header(props: { variant: TeamCardProps['variant'] }) {
  const Icon = props.variant === 'assigned' ? FiUsers : FiAlertCircle

  return (
    <header className="flex items-center gap-2 bg-tertiary px-6 py-3">
      <Icon size={18} className="text-dark-brown" aria-hidden />
      <h3 className="m-0 font-serif text-lg text-dark-brown">Sua Equipe</h3>
    </header>
  )
}

function AssignedBody(props: AssignedVariantProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center rounded-xl bg-primary text-white h-10 w-10">
          <FiUsers size={22} />
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-black font-normal">Equipe Atribuída</span>
          <span className="font-serif text-xl text-dark-brown font-medium">{props.team.name}</span>
        </div>
      </div>

      {props.team.description && (
        <p className="m-0 rounded-lg bg-tertiary-background px-4 py-3 text-sm text-secondary-foreground">
          {props.team.description}
        </p>
      )}

      <hr className="border-tertiary" />
      {props.team.coordinators.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-black">Coordenadores da Equipe</span>
          <div className="flex flex-col gap-2">
            {props.team.coordinators.map((coordinator) => (
              <CoordinatorRow
                key={coordinator.id}
                name={coordinator.name}
                phone={coordinator.phone}
              />
            ))}
          </div>
        </div>
      )}

      <div className="pt-1 self-center">
        <Button onClick={props.onViewProfile}>
          <span className="inline-flex items-center gap-2">
            Ver Perfil da Equipe <FiArrowRight aria-hidden />
          </span>
        </Button>
      </div>
    </>
  )
}

function PendingBody(props: PendingVariantProps) {
  return (
    <>
      <EmptyState
        icon={<FiUsers size={28} className="text-blue" aria-hidden />}
        title="Aguardando Atribuição de Equipe"
        description="Sua inscrição foi aprovada! A coordenação está analisando suas preferências e habilidades para atribuí-lo à equipe ideal."
      />

      <PreferencesPanel preferences={props.preferences} />
    </>
  )
}

function WaitingListBody(props: WaitingListVariantProps) {
  return (
    <>
      <EmptyState
        icon={<FiClock size={28} className="text-blue" aria-hidden />}
        title="Você está na Lista de Espera"
        description="Sua inscrição foi recebida! Devido à alta demanda, você foi colocado na lista de espera. Entraremos em contato caso uma vaga seja disponibilizada."
      />

      <div className="rounded-lg border border-tertiary bg-tertiary-background px-4 py-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
          <FiAlertCircle size={16} aria-hidden />O que você pode fazer:
        </div>
        <ul className="m-0 list-disc pl-5 text-sm text-dark-brown">
          <li>Participe das espiritualidades para aumentar suas chances</li>
          <li>Mantenha seus dados de contato atualizados</li>
          <li>Aguarde contato da coordenação</li>
        </ul>
      </div>

      <PreferencesPanel preferences={props.preferences} />
    </>
  )
}

function EmptyState(props: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue/10">
        {props.icon}
      </div>
      <h4 className="m-0 font-serif text-lg text-dark-brown">{props.title}</h4>
      <p className="m-0 text-sm text-black">{props.description}</p>
    </div>
  )
}

function PreferencesPanel(props: { preferences: TeamPreference[] }) {
  if (props.preferences.length === 0) {
    return null
  }
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg">
      <span className="text-xs text-black font-semibold">Suas Preferências:</span>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {props.preferences.map((preference) => (
          <Pill key={preference.key}>{preference.name}</Pill>
        ))}
      </div>
    </div>
  )
}
