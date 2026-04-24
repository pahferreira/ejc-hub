import { FiClock } from 'react-icons/fi'

type PlaceholderProps = {
  title?: string
}

export function Placeholder(props: PlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <FiClock size={48} className="text-secondary" />
      <h2 className="text-xl font-semibold text-dark-brown m-0">{props.title ?? 'Em breve'}</h2>
      <p className="text-secondary-foreground/70 m-0">
        Esta funcionalidade estará disponível em breve.
      </p>
    </div>
  )
}
