import { useNavigate } from 'react-router'
import { EventBanner } from '../components/EventBanner/EventBanner'
import { InscriptionCard } from '../components/InscriptionCard/InscriptionCard'
import { SubscribeCard } from '../components/SubscribeCard/SubscribeCard'
import { TeamCard } from '../components/TeamCard/TeamCard'
import { ROUTE_PATHS } from '../constants/routePaths'
import { useCurrentEventQuery } from '../services/events/useCurrentEventQuery'
import { useCurrentEventSubscriptionStatusQuery } from '../services/events/useCurrentEventSubscriptionStatusQuery'
import type { SubscriptionStatus, TeamPreference } from '../services/events/events.types'
import { useCurrentUserQuery } from '../services/users/useCurrentUserQuery'
import { getHomeView, type HomeView } from './getHomeView'

export function Home() {
  const navigate = useNavigate()
  const currentEventQuery = useCurrentEventQuery()
  const subscriptionStatusQuery = useCurrentEventSubscriptionStatusQuery()
  const { data: user } = useCurrentUserQuery()

  const greetingName = user?.nickname ?? user?.name ?? ''
  const isLoading = currentEventQuery.isLoading || subscriptionStatusQuery.isLoading
  const isError = currentEventQuery.isError || subscriptionStatusQuery.isError

  const event = currentEventQuery.data
  const subscriptionStatus = subscriptionStatusQuery.data?.subscriptionStatus ?? null
  const assignedTeam = subscriptionStatusQuery.data?.assignedTeam ?? null
  const preferences = subscriptionStatusQuery.data?.preferences ?? []

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-8xl">
        <header className="mb-6">
          <h1 className="m-0 text-2xl font-bold text-black sm:text-3xl">
            Bem-vindo{greetingName ? `, ${greetingName}` : ''}! 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Aqui está um resumo do seu evento atual e status de inscrição.
          </p>
        </header>

        {isLoading ? (
          <LoadingSkeleton />
        ) : isError || !event ? (
          <ErrorState />
        ) : (
          <div className="flex flex-col gap-6">
            <EventBanner
              name={event.name}
              description={event.description}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              location={event.location}
            />

            <HomeBody
              view={getHomeView(subscriptionStatus, assignedTeam)}
              eventName={event.name}
              subscriptionStatus={subscriptionStatus}
              preferences={preferences}
              onSubscribe={() => navigate(ROUTE_PATHS.SUBSCRIPTIONS_NEW)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

type HomeBodyProps = {
  view: HomeView
  eventName: string
  subscriptionStatus: SubscriptionStatus | null
  preferences: TeamPreference[]
  onSubscribe: () => void
}

function HomeBody(props: HomeBodyProps) {
  if (props.view.kind === 'subscribe') {
    return <SubscribeCard eventName={props.eventName} onSubscribe={props.onSubscribe} />
  }

  if (!props.subscriptionStatus) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <InscriptionCard subscriptionStatus={props.subscriptionStatus} />
      {props.view.kind === 'assignedTeam' && <TeamCard variant="assigned" team={props.view.team} />}
      {props.view.kind === 'pendingTeam' && (
        <TeamCard variant="pending" preferences={props.preferences} />
      )}
      {props.view.kind === 'waitingList' && (
        <TeamCard variant="waitingList" preferences={props.preferences} />
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-40 w-full animate-pulse rounded-2xl bg-tertiary" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="h-72 w-full animate-pulse rounded-xl bg-tertiary" />
        <div className="h-72 w-full animate-pulse rounded-xl bg-tertiary" />
      </div>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="rounded-xl border border-tertiary bg-white px-6 py-8 text-center shadow-md">
      <p className="m-0 text-sm text-gray-600">
        Não foi possível carregar as informações do evento. Tente novamente em alguns instantes.
      </p>
    </div>
  )
}
