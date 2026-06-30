import { Button } from '../Button/Button'
import { Logo } from '../Logo/Logo'
import { Navlink } from './Navlink'

type NavbarButton = {
  label?: string
  onClick: () => void
}

type NavbarItem = {
  name: string
  to: string
}

type NavbarProps = {
  imageSrc?: string
  navItems?: NavbarItem[]
  button?: NavbarButton
}

export const Navbar = (props: NavbarProps) => (
  <header className="border-b border-slate-300/10 w-full bg-tertiary">
    <nav className="flex items-center p-4 w-full max-w-8xl mx-auto justify-between gap-4">
      <div className="flex items-center">
        {props.imageSrc && (
          <figure>
            <img src={props.imageSrc || '/church.svg'} alt="Igreja" className="mr-3" />
          </figure>
        )}
        <Logo />
      </div>
      {props.navItems && props.navItems.length > 0 && (
        <ul className="flex w-full justify-end gap-8 list-none">
          {props.navItems?.map((item) => (
            <li key={item.to}>
              <Navlink to={item.to} name={item.name} />
            </li>
          ))}
        </ul>
      )}
      {props.button && (
        <Button variant="primary" onClick={props.button?.onClick}>
          {props.button?.label}
        </Button>
      )}
    </nav>
  </header>
)
