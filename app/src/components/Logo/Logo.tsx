type LogoProps = {
  iconOnly?: boolean
}

export function Logo(props: LogoProps) {
  if (props.iconOnly) {
    return (
      <div className="w-9 h-8 rounded-lg bg-dark-brown flex justify-center items-center">
        <span className="text-white font-extrabold text-xl font-serif leading-0">
          .<span className="font-semibold text-base">EJC</span>
        </span>
      </div>
    )
  }

  return (
    <span className="m-0 text-lg font-bold leading-none font-serif text-primary">
      ponto
      <span className="text-dark-brown text-xl font-extrabold">EJC</span>
    </span>
  )
}
