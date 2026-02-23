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
  imageSrc?: string
  navItems?: NavbarItem[]
  logout?: NavbarLogout
}

export const Navbar = (props: NavbarProps) => (
  <header className="border-b border-slate-300/10">
    <nav className="flex items-center px-14 py-4">
      <div className="flex items-center">
        {props.imageSrc && (
          <figure>
            <img src={props.imageSrc || '/church.svg'} alt="Igreja" className="mr-3" />
          </figure>
        )}
        {props.title && <h1 className="m-0 text-xl font-bold leading-none">{props.title}</h1>}
      </div>
      <ul className="ml-[54px] flex gap-8 list-none">
        {props.navItems?.map((item) => (
          <li key={item.to}>
            <Navlink to={item.to} name={item.name} />
          </li>
        ))}
      </ul>
      {props.logout && (
        <button
          onClick={props.logout.onClick}
          className="ml-auto flex cursor-pointer items-center gap-2 border-none bg-transparent border-b-2 border-transparent transition-[border-bottom] duration-200 ease hover:border-current"
        >
          <FiLogOut />
          {props.logout.label && <span>{props.logout.label}</span>}
        </button>
      )}
    </nav>
  </header>
)
