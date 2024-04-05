import React, { useState, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import { useAuth0 } from '@auth0/auth0-react'
import { Link } from 'react-router-dom'
import '../style/Nav.css'

const NavUser = (): React.ReactElement => {
  const { isAuthenticated, isLoading, loginWithRedirect, user, logout, getAccessTokenSilently } = useAuth0()
  const [permissions, setPermissions] = useState<string[]>([])

  const getPermissions = async (token: string): Promise<string[]> => {
    const payload = jwtDecode<{
      permissions?: string[]
    }>(token)
    return payload.permissions ?? []
  }

  useEffect(() => {
    const fetchPermissions = async (): Promise<void> => {
      try {
        const token = await getAccessTokenSilently()
        const fetchedPermissions = await getPermissions(token)
        setPermissions(fetchedPermissions)
      } catch (error) {
        console.error('Error fetching permissions:', error)
      }
    }

    void fetchPermissions()
  }, [])
  return (
    <div className='nav-user'>
      {
        isAuthenticated
          ? <span className='user-info'>
            <div className='profile-pic'>
              <img src={user?.picture} alt='' />
            </div>
            <div className='side-info'>
              <Link to='/profile'>{user?.name}</Link>
              <div className='lower-actions'>
                {
                  permissions.includes('admin:manage')
                    ? <Link to='/admin' id='admin'>Admin Portal</Link>
                    : null
                }
                <p id='logout' onClick={(_) => {
                  logout({
                    logoutParams: {
                      returnTo: `${window.location.protocol}//${window.location.host}`
                    }
                  })
                    .then(r => { console.log(r) })
                    .catch(e => { console.log(e) })
                }}>Logout</p>
              </div>
            </div>
          </span>
          : isLoading
            ? <span className='user-info'>
              <div className='profile-pic'>
                <img src='/assets/placeholder.jpg' alt='' />
              </div>
              <div className='side-info'>
                <p className='loading nav'></p>
                <p className='loading nav smaller'></p>
              </div>
            </span>
            : <button className='nav-button'
              onClick={(_) => {
                loginWithRedirect({
                  authorizationParams: {
                    scope: 'openid profile email'
                  }
                })
                  .then(r => { console.log(r) })
                  .catch(e => { console.log(e) })
              }}>Login</button>
      }
    </div>
  )
}

export default NavUser
