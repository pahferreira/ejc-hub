import React from 'react'

import './styles/navbar.css'
import { Navlink } from './Navlink'

export const Navbar = () => (
  <header>
    <div className='navbar'>
      <div className='navbar-content'>
        <div className='navbar-brand'>
          <img src='/church.svg' alt='Igreja' className='navbar-logo' />
          <h1>EJC Rosário</h1>
        </div>
        <div className='navbar-routes'>
          <Navlink to='/registration' name='Inscrição' />
          <Navlink to='/dashboard' name='Dashboard' />
          <Navlink to='/teams' name='Equipes' />
        </div>
      </div>
    </div>
  </header>
)
