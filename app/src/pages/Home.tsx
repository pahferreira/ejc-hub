import { FiCalendar, FiFileText, FiList } from 'react-icons/fi'
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

// Hardcoded flag for testing - change to simulate different states
const isSubscribedToCurrentEvent = false

export function Home() {
  const { permissions } = useAuthentication()
  const navigate = useNavigate()

  const canManageEvents = hasPermission(permissions, EventPermissions.Read)
  const canManageTemplates = hasPermission(permissions, TeamTemplatePermissions.Read)
  const canViewSubscriptions = hasPermission(permissions, SubscriptionPermissions.Read)
  const canCreateSubscription = hasPermission(permissions, SubscriptionPermissions.Create)

  const hasAdminPermissions = hasAnyPermission(permissions, [
    EventPermissions.Read,
    TeamTemplatePermissions.Read,
    SubscriptionPermissions.Read,
  ])

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Section */}
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 m-0">Bem-vindo ao EJC Hub</h1>
          <p className="mt-2 text-gray-600">Gerencie suas atividades e acompanhe os eventos</p>
        </header>

        <div className="flex flex-col gap-8">
          {/* User Subscription Status */}
          <DashboardSection
            title="Sua Inscrição"
            subtitle="Status da sua participação no próximo encontro"
          >
            {isSubscribedToCurrentEvent ? (
              <StatusCard
                title="EJC 2024"
                variant="success"
                description="Você já está inscrito no próximo encontro. Sua inscrição foi confirmada!"
              />
            ) : (
              <StatusCard
                title="EJC 2024"
                variant="warning"
                description="Você ainda não se inscreveu no próximo encontro. Não perca essa oportunidade!"
                action={
                  canCreateSubscription
                    ? {
                        label: 'Fazer Inscrição',
                        onClick: () => navigate('/subscriptions/new'),
                      }
                    : undefined
                }
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
    </main>
  )
}
