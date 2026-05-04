import { FiCalendar, FiFileText, FiList, FiPenTool } from 'react-icons/fi'
import { useNavigate } from 'react-router'
import { ActionCard } from '../components/ActionCard/ActionCard'
import { StatusCard } from '../components/StatusCard/StatusCard'
import { DashboardSection } from '../components/DashboardSection/DashboardSection'
import { useAuthentication } from '../hooks/useAuthentication'
import { hasPermission, hasAnyPermission } from '../../../common/permissions'
import {
  EventPermissions,
  TeamTemplatePermissions,
  SubscriptionPermissions,
} from '../../../common/permissions'
import { useCurrentEventSubscriptionStatusQuery } from '../services/events/useCurrentEventSubscriptionStatusQuery'
import { subscriptionStatusDisplay } from '../services/events/subscriptionStatusDisplay'

export function Home() {
  const { permissions } = useAuthentication()
  const navigate = useNavigate()
  const subscriptionStatusQuery = useCurrentEventSubscriptionStatusQuery()

  const canManageEvents = hasPermission(permissions, EventPermissions.Read)
  const canManageTemplates = hasPermission(permissions, TeamTemplatePermissions.Read)
  const canViewSubscriptions = hasPermission(permissions, SubscriptionPermissions.Read)

  const hasAdminPermissions = hasAnyPermission(permissions, [
    EventPermissions.Read,
    TeamTemplatePermissions.Read,
    SubscriptionPermissions.Read,
  ])

  const subscriptionStatus = subscriptionStatusQuery.data?.subscriptionStatus ?? null
  const eventName = subscriptionStatusQuery.data?.eventName
  const statusDisplay = subscriptionStatus ? subscriptionStatusDisplay[subscriptionStatus] : null
  const subscriptionSectionSubtitle = eventName
    ? `Como está a sua participação no ${eventName}.`
    : 'Como está a sua participação no próximo encontro.'

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-black m-0">
            Bem-vindo ao <span className="font-serif text-dark-brown">Ponto EJC</span>
          </h1>
          <p className="mt-2 text-gray-600">
            Tudo o que você precisa saber sobre o EJC Rosário em um só lugar!
          </p>
        </header>

        <div className="flex flex-col gap-8">
          {/* User Subscription Status */}
          <DashboardSection title="Sua Inscrição" subtitle={subscriptionSectionSubtitle}>
            {subscriptionStatusQuery.isLoading ? (
              <div className="h-24 max-w-xs rounded-xl bg-gray-200 animate-pulse" />
            ) : statusDisplay ? (
              <StatusCard
                value={statusDisplay.label}
                variant={statusDisplay.variant}
                description={statusDisplay.description}
              />
            ) : (
              <ActionCard
                icon={<FiPenTool size={20} />}
                title={eventName ? `Fazer Inscrição no ${eventName}` : 'Fazer Inscrição'}
                description="Você ainda não se inscreveu no próximo encontro. Não perca essa oportunidade!"
                onClick={() => navigate('/subscriptions/new')}
              />
            )}
          </DashboardSection>

          {/* Admin Section - Only visible with admin permissions */}
          {hasAdminPermissions && (
            <DashboardSection
              title="Administração"
              subtitle="Gerencie eventos, equipes e inscrições"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {canManageEvents && (
                  <ActionCard
                    icon={<FiCalendar size={20} />}
                    title="Gerenciar Eventos"
                    description="Crie e gerencie os eventos do EJC"
                    to="/events"
                  />
                )}
                {canManageTemplates && (
                  <ActionCard
                    icon={<FiFileText size={20} />}
                    title="Gerenciar Templates"
                    description="Configure templates de equipes"
                    to="/templates"
                  />
                )}
                {canViewSubscriptions && (
                  <ActionCard
                    icon={<FiList size={20} />}
                    title="Listar Inscrições"
                    description="Visualize todas as inscrições"
                    to="/subscriptions"
                  />
                )}
              </div>
            </DashboardSection>
          )}
        </div>
      </div>
    </div>
  )
}
