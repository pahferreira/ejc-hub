import { Link } from 'react-router'

export type NavlinkProps = {
  name: string
  to: string
}

export const Navlink = (props: NavlinkProps) => {
  return (
    <Link
      to={props.to}
      className="no-underline cursor-pointer border-b-2 border-transparent transition-[border-bottom] duration-200 ease hover:border-current"
    >
      {props.name}
    </Link>
  )
}
