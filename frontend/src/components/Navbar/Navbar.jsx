import React from 'react'
import './navbar.css'
import Logo from '../../assets/logo_trans.png'

const Navbar = () => {
  return (
    <div className='Navbar-container'>
      <div className='Navbar-logo'>
        <img className='Navbar-logo-img'src={Logo} alt="logo" />
      </div>
    </div>
  )
}

export default Navbar