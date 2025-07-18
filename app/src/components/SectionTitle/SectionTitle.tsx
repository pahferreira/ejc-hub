import './SectionTitle.css'

type SectionTitleProps = {
  title: string
  description?: string
}

export function SectionTitle(props: SectionTitleProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold m-0">{props.title}</h1>
      <p className="text-base not-italic font-normal my-2">{props.description}</p>
    </div>
  )
}
