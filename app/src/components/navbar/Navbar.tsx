import { Navlink } from './Navlink'

type NavbarProps = {
  title?: string
  imageSrc?: string
  navItems?: Array<{ name: string; to: string }>
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
    </nav>
  </header>
)
