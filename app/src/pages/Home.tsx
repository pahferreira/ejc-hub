import { FiFolderPlus, FiUserPlus, FiUsers } from 'react-icons/fi'
import { Button } from '../components/Button/Button'
import { FeatureCard } from '../components/FeatureCard/FeatureCard'

export function Home() {
  return (
    <main className="flex flex-col gap-3 md:gap-6 justify-center min-h-screen p-8">
      <section>
        <h1 className="uppercase font-bold text-4xl">Bem vindo ao</h1>
        <h2 className="uppercase font-semibold text-3xl text-blue-500">EJC Hub Rosário</h2>
      </section>
      <p className="text-base text-black">
        Uma plataforma com tudo que você precisa saber sobre o EJC Rosário.
      </p>
      <div className="max-w-lg w-full self-center">
        <Button variant="primary" onClick={() => alert('Clicou!')}>
          Entrar!
        </Button>
      </div>
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        <FeatureCard
          title="Inscrições Simplificadas"
          description="Faça sua inscrição com formulários intuitivos e acompanhamento em tempo real."
          icon={<FiUserPlus size={24} />}
        />
        <FeatureCard
          title="Montagens Personalizadas"
          description="Personalize e organize suas montagens de forma prática, garantindo agilidade e controle durante todo o processo."
          icon={<FiFolderPlus size={24} />}
        />
        <FeatureCard
          title="Equipes Colaborativas"
          description="Descubra tudo sobre sua equipe e colabore de forma eficiente."
          icon={<FiUsers size={24} />}
        />
      </section>
    </main>
  )
}
