import {
  FiCalendar,
  FiClipboard,
  FiFolderPlus,
  FiStar,
  FiTag,
  FiThumbsUp,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi'
import { Button } from '../components/Button/Button'
import { FeatureCard } from '../components/FeatureCard/FeatureCard'
import { Navbar } from '../components/Navbar/Navbar'
import { useAuth0 } from '@auth0/auth0-react'

export function Welcome() {
  const { loginWithRedirect } = useAuth0()

  const handleLogin = () =>
    loginWithRedirect({
      appState: { returnTo: '/home' },
    })

  return (
    <div className="bg-welcome-gradient">
      {/* Section 1 — Hero */}
      <div className="flex min-h-screen flex-col">
        <Navbar
          titleLight="Ponto "
          title="EJC"
          navItems={[]}
          button={{ label: 'Inscreva-se', onClick: handleLogin }}
        />

        <main className="flex flex-1 flex-col gap-10 max-w-7xl mx-auto items-center justify-center p-8">
          <section className="flex w-full flex-col gap-8">
            <div className="w-full flex flex-col items-start gap-2">
              <span className="text-xs uppercase tracking-widest text-black font-light">
                EJC Rosário 2026
              </span>
              <h1 className="font-serif text-6xl leading-tight text-white md:text-7xl">
                Ponto <span className="font-bold text-dark-brown">EJC</span>
              </h1>
              <p className="max-w-xl text-base text-left leading-relaxed text-black font-medium">
                Gerencie inscrições, equipes e todo o processo do seu EJC em um só lugar. Sem papel,
                sem planilhas — tudo organizado.
              </p>
            </div>

            <Button variant="primary" onClick={handleLogin}>
              Inscrever-se →
            </Button>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <FeatureCard
                title="Inscrições"
                description="Inscreva-se online com prioridade automática."
                icon={<FiUserPlus size={24} />}
              />
              <FeatureCard
                title="Equipes"
                description="Acompanhe as equipes, vagas e coordenadores."
                icon={<FiUsers size={24} />}
              />
              <FeatureCard
                title="Cronograma"
                description="Fique por dentro de todas as atividades no decorrer do evento."
                icon={<FiCalendar size={24} />}
              />
            </div>
          </section>
          <section className="flex flex-col w-full">
            <div className="text-left lg:text-center flex flex-col md:items-center">
              <h2 className="font-serif text-4xl font-bold text-dark-brown md:text-5xl">
                Etapas do EJC
              </h2>
              <p className="mt-2 mb-6 max-w-lg text-base leading-relaxed text-black">
                Do início ao fim, cada fase é organizada e acompanhada pelo Ponto EJC.
              </p>
            </div>

            <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-3 mb-10">
              <FeatureCard
                title="Inscrições"
                description="Coleta de dados, habilidades e preferências de equipe"
                icon={<FiUserPlus size={24} />}
                number={1}
              />
              <FeatureCard
                title="Montagens de Equipes"
                description="Formação das equipes respeitando prioridades e capacidades"
                icon={<FiFolderPlus size={24} />}
                number={2}
              />
              <FeatureCard
                title="Preparação"
                description="Recrutamento, controle de presença e financeiro"
                icon={<FiClipboard size={24} />}
                number={3}
              />
              <FeatureCard
                title="Uniforme"
                description="Pedido e controle de pagamento das camisetas"
                icon={<FiTag size={24} />}
                number={4}
              />
              <FeatureCard
                title="O Grande Dia"
                description="Execução do evento com cronograma em tempo real"
                icon={<FiStar size={24} />}
                number={5}
              />
              <FeatureCard
                title="Feedback"
                description="Avaliação de líderes e membros para melhoria contínua"
                icon={<FiThumbsUp size={24} />}
                number={6}
              />
            </section>
          </section>
        </main>
        <footer className="p-4 bg-tertiary text-center">
          <span className="text-lg font-bold leading-none font-serif text-white">
            Ponto
            <span className="text-dark-brown"> EJC</span>
          </span>
          <p className="text-black text-sm mt-1">Organizando o EJC com carinho e eficiência.</p>
        </footer>
      </div>
    </div>
  )
}
