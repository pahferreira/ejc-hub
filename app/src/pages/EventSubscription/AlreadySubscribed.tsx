import { FiCheckCircle } from 'react-icons/fi'
import { useNavigate } from 'react-router'
import { Card } from '../../components/Card/Card'
import { StatusCard } from '../../components/StatusCard/StatusCard'
import { Button } from '../../components/Button/Button'
import { subscriptionStatusDisplay } from '../../services/events/subscriptionStatusDisplay'
import { ROUTE_PATHS } from '../../constants/routePaths'
import type { SubscriptionStatus } from '../../services/events/events.types'
import { useCountdown } from '../../hooks/useCountdown/useCountdown'

const REDIRECT_SECONDS = 20

type AlreadySubscribedProps = {
  status: SubscriptionStatus
  eventName?: string
}

export function AlreadySubscribed(props: AlreadySubscribedProps) {
  const navigate = useNavigate()
  const statusDisplay = subscriptionStatusDisplay[props.status]

  const handleGoHome = () => navigate(ROUTE_PATHS.HOME, { replace: true })

  const seconds = useCountdown(REDIRECT_SECONDS, handleGoHome)

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Você já está inscrito{props.eventName ? ` no ${props.eventName}` : ''}
            </h1>
            <FiCheckCircle size={30} className="text-green ml-2" />
          </div>
          <p className="text-black text-base">A sua inscrição já foi realizada e encontra-se:</p>
          <StatusCard
            value={statusDisplay.label}
            variant={statusDisplay.variant}
            description={statusDisplay.description}
          />

          <div>
            <p className="text-base text-black text-center">Aguarde mais novidades!</p>

            <p className="text-sm text-black font-light text-center">
              Redirecionando para o início em <span className="font-bold">{seconds}</span>{' '}
              segundos...
            </p>
          </div>

          <Button variant="primary" onClick={handleGoHome}>
            Ir para o início agora
          </Button>
        </div>
      </Card>
    </div>
  )
}
