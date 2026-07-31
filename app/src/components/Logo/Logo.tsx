import logoUrl from '../../assets/pontoejc-logo.png'

type LogoProps = {
  iconOnly?: boolean
}

export function Logo(props: LogoProps) {
  if (props.iconOnly) {
    return <img src={logoUrl} alt="Ponto EJC" className="w-8 h-8 rounded-lg shrink-0" />
  }

  return (
    <span className="m-0 text-lg font-bold leading-none font-serif text-primary">
      ponto
      <span className="text-dark-brown text-xl font-extrabold">EJC</span>
    </span>
  )
}
