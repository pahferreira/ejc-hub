import { FiPlus, FiUserPlus } from 'react-icons/fi'
import { Button } from '../Button/Button'

export type SubscribeCardProps = {
  eventName: string
  onSubscribe: () => void
  onBrowseTeams?: () => void
}

export function SubscribeCard(props: SubscribeCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border-2 border-red bg-white shadow-md">
      <header className="bg-tertiary px-6 py-3">
        <h3 className="m-0 font-serif text-lg text-dark-brown">Status de Inscrição</h3>
      </header>

      <div className="flex flex-col items-center gap-4 px-6  py-6 text-center">
        <div className="w-20 h-20">
          <FiUserPlus size={26} className="text-red" />
        </div>

        <h4 className="m-0 font-serif text-xl text-dark-brown">
          Você ainda não possui uma inscrição
        </h4>
        <p className="m-0 max-w-md text-sm text-gray-600">
          Para participar do {props.eventName}, você precisa fazer sua inscrição. Não perca a
          oportunidade de viver essa experiência transformadora!
        </p>

        <Button onClick={props.onSubscribe}>
          <span className="inline-flex items-center gap-2">
            <FiPlus aria-hidden />
            Nova Inscrição
          </span>
        </Button>
      </div>
    </section>
  )
}
