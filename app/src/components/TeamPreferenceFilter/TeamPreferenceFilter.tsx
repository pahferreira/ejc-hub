import { FilterToggle } from '../FilterToggle/FilterToggle'

export type TeamPreferenceScope = 'team' | 'all'

type TeamPreferenceFilterProps = {
  teamName: string
  value: TeamPreferenceScope
  onChange: (value: TeamPreferenceScope) => void
}

export function TeamPreferenceFilter(props: TeamPreferenceFilterProps) {
  const options = [
    { value: 'team' as const, label: props.teamName },
    { value: 'all' as const, label: 'Todas as inscrições' },
  ]

  return (
    <div className="flex gap-1 items-center">
      <span className="text-xs uppercase font-semibold text-dark-brown">Pref.</span>
      <FilterToggle
        options={options}
        value={props.value}
        onChange={(v) => props.onChange(v as TeamPreferenceScope)}
      />
    </div>
  )
}
