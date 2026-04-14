import { FiLogOut } from 'react-icons/fi'
import { Navlink } from './Navlink'

type NavbarLogout = {
  label?: string
  onClick: () => void
}

type NavbarItem = {
  name: string
  to: string
}

type NavbarProps = {
  title?: string
  titleLight?: string
  imageSrc?: string
  navItems?: NavbarItem[]
  logout?: NavbarLogout
}

export const Navbar = (props: NavbarProps) => (
  <header className="border-b border-slate-300/10 w-full bg-tertiary">
    <nav className="flex items-center p-4 w-full max-w-7xl mx-auto justify-between gap-4">
      <div className="flex items-center w-full">
        {props.imageSrc && (
          <figure>
            <img src={props.imageSrc || '/church.svg'} alt="Igreja" className="mr-3" />
          </figure>
        )}
        {props.title && (
          <span className="m-0 text-xl font-bold leading-none font-serif text-white">
            {props.titleLight}
            <span className="text-primary">{props.title}</span>
          </span>
        )}
      </div>
      <ul className="flex w-full justify-end gap-8 list-none">
        {props.navItems?.map((item) => (
          <li key={item.to}>
            <Navlink to={item.to} name={item.name} />
          </li>
        ))}
      </ul>
      {props.logout && (
        <button
          onClick={props.logout.onClick}
          className="ml-auto flex cursor-pointer items-center gap-2 bg-transparent border border-dark-brown rounded-md px-2 py-1"
        >
          <FiLogOut />
          {props.logout.label && <span>{props.logout.label}</span>}
        </button>
      )}
    </nav>
  </header>
)
