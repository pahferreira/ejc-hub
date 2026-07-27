import { FiLock } from 'react-icons/fi'

export type SubscriptionsClosedCardProps = {
  eventName: string
}

export function SubscriptionsClosedCard(props: SubscriptionsClosedCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border-2 border-red bg-white shadow-md">
      <header className="bg-tertiary px-6 py-3">
        <h3 className="m-0 font-serif text-lg text-dark-brown">Status de Inscrição</h3>
      </header>

      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-tertiary">
          <FiLock size={24} className="text-dark-brown" aria-hidden />
        </div>

        <h4 className="m-0 font-serif text-xl text-dark-brown">As inscrições estão encerradas</h4>
        <p className="m-0 max-w-md text-sm text-gray-600">
          O período de inscrições para o {props.eventName} já foi encerrado.
          <br />
          Fique de olho para não perder a próxima abertura.
        </p>
      </div>
    </section>
  )
}
