import logoUrl from '../../assets/pontoejc-logo.png'

type LogoProps = {
  iconOnly?: boolean
}

export function Logo(props: LogoProps) {
  if (props.iconOnly) {
    return <img src={logoUrl} alt="Ponto EJC" className="w-9 h-9 rounded-full shrink-0" />
  }

  return (
    <span className="flex items-center gap-2">
      <span className="m-0 text-lg font-bold leading-none font-serif text-primary">
        ponto
        <span className="text-dark-brown text-xl font-extrabold">EJC</span>
      </span>
      {/* alt empty: the wordmark already carries the name for screen readers */}
      <img src={logoUrl} alt="" className="w-8 h-8 rounded-full shrink-0" />
    </span>
  )
}
