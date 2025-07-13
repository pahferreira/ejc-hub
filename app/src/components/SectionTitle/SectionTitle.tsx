import './SectionTitle.css'

type SectionTitleProps = {
  title: string
  description?: string
}

export function SectionTitle(props: SectionTitleProps) {
  return (
    <div>
      <h1 className="section-title">{props.title}</h1>
      <p className="section-description">{props.description}</p>
    </div>
  )
}
