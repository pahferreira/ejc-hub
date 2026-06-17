type TeamSelectionSectionProps = {
  teamOptions: { key: string; name: string; description: string }[]
}

export function TeamSelectionSection(props: TeamSelectionSectionProps) {
  console.log(props)
  return <div>TeamSelectionSection</div>
}
