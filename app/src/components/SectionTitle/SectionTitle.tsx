type SectionTitleProps = {
  title: string
  description?: string
}

export function SectionTitle(props: SectionTitleProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900">{props.title}</h3>
      {props.description && (
        <p className="text-sm text-black font-light italic">{props.description}</p>
      )}
    </div>
  )
}
