import React from 'react'
import { Link } from 'react-router'

import './styles/navlink.css'

export interface INavlinkProps {
  name: string
  to: string
}

export const Navlink = ({ name, to }: INavlinkProps) => {
  return (
    <Link to={to} className='navlink'>
      {name}
    </Link>
  )
}
