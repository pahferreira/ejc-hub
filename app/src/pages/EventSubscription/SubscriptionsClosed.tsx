import { FiClock } from 'react-icons/fi'
import { useNavigate } from 'react-router'
import { Card } from '../../components/Card/Card'
import { Button } from '../../components/Button/Button'
import { ROUTE_PATHS } from '../../constants/routePaths'

export const SUBSCRIPTIONS_CLOSED_MESSAGE = 'As inscrições para o evento foram encerradas, aguarde.'

export function SubscriptionsClosed() {
  const navigate = useNavigate()

  const handleGoHome = () => navigate(ROUTE_PATHS.HOME, { replace: true })

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card>
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Inscrições encerradas</h1>
            <FiClock size={28} className="text-primary ml-2" />
          </div>
          <p className="text-black text-base text-center">{SUBSCRIPTIONS_CLOSED_MESSAGE}</p>

          <Button variant="primary" onClick={handleGoHome}>
            Ir para o início
          </Button>
        </div>
      </Card>
    </div>
  )
}
