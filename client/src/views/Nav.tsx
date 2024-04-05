import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faComments } from '@fortawesome/free-solid-svg-icons'
import '../style/Nav.css'
import NavUser from '../components/NavUser'
import NavPost from '../components/NavPost'
import Search from '../components/Search'

// Nav definition. Combines Search, NavPost, NavUser components into navbar
const Nav = (): React.ReactElement => {
  const [isOpen, setOpen] = useState(false)
  const { isAuthenticated } = useAuth0()

  // Toggle main navbar visibility info (user info, searchbar, etc) when opened / closed
  const handleNavToggle = (): void => {
    setOpen(!isOpen)
  }
  return (
    <div className='nav'>
      {/* Desktop navbar view */}
        <div id='desktop' className='nav container'>
            <Link to='/' className='nav child left'>
                <img src={'/assets/tmu_logo.png'} alt='logo' className='logo' />
                <h2>TMU Connect</h2>
            </Link>
            <div className='nav child'>
                <Search/>
            </div>
            <div className='nav child right'>
              {
                isAuthenticated
                  ? <Link to={'/conversations'} className='nav-button'><FontAwesomeIcon icon={faComments}/></Link>
                  : null
              }
                <NavPost/>
                <NavUser/>
            </div>
        </div>
        {/* Mobile navbar view */}
        <div id='mobile' className='nav container'>
            <div className='top-nav'>
                <Link to='/' className='mobile-left'>
                    <img src={'/assets/tmu_logo.png'} alt='logo' className='logo' />
                    <h2>TMU Connect</h2>
                </Link>
                <div className='mobile-right'>
                    <FontAwesomeIcon className={`${isOpen ? 'nav-icon active' : 'nav-icon'}`} icon={faBars} onClick={handleNavToggle}/>
                </div>
            </div>
            {/* Show / hide Search, NavUser, NavPost components when hamburger icon is clicked */}
            <div id={`${isOpen ? 'show' : 'hidden'}`} className='bottom-nav'>
                <div className='nav-user-container'>
                    {
                        isAuthenticated
                          ? <p>Welcome Back!</p>
                          : <p>Welcome!</p>
                    }
                    <NavUser />
                </div>
                <Search />
                <div className='action-row'>
                    {
                    isAuthenticated
                      ? <Link to={'/conversations'} className='nav-button'><FontAwesomeIcon icon={faComments}/></Link>
                      : null
                    }
                    <NavPost/>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Nav
