import React, { useState, useEffect } from 'react'
import Nav from '../views/Nav'
import AuthDenied from '../components/AuthDenied'
import '../style/Admin.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faList, faCog, faHome, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { jwtDecode } from 'jwt-decode'
import { useAuth0 } from '@auth0/auth0-react'
import Dashboard from '../components/Admin/Dashboard'
import Users from '../components/Admin/Users'
import Listings from '../components/Admin/Listings'

// Admin page component definition
const Admin = (): React.ReactElement => {
  const { isAuthenticated, user, getAccessTokenSilently, isLoading } = useAuth0()
  const [permissions, setPermissions] = useState<string[]>([])
  const [desiredView, setDesiredView] = useState<string>('dashboard')

  // Obtain permissions payload
  const getPermissions = async (token: string): Promise<string[]> => {
    const payload = jwtDecode<{
      permissions?: string[]
    }>(token)
    return payload.permissions ?? []
  }

  // Verify user is an admin
  useEffect(() => {
    // Exits if user is not an authenticated admin
    if (user == null) {
      return
    }

    // Fetch user's permissions from server
    const fetchPermissions = async (): Promise<void> => {
      try {
        const token = await getAccessTokenSilently()
        const fetchedPermissions = await getPermissions(token)
        setPermissions(fetchedPermissions)
      } catch (error) {
        console.error('Error fetching permissions:', error)
        setPermissions([])
      }
    }

    void fetchPermissions()
  }, [user])

  // Display Loading status while fetching permissions
  if (isLoading) {
    return (
            <div className='App'>
                <header className='App-header'>
                    <Nav />
                    <div className='loading-container'>
                        <div className='loading-content'>
                            <span className="loader"></span>
                        </div>
                    </div>
                </header>
            </div>
    )
  }

  return (
        <div className='App'>
            <header className='App-header'>
                <Nav />
                {/* Display admin portal if authenticated, otherwise deny access */}
                {
                    isAuthenticated
                      ? permissions.includes('admin:manage')
                        ? <div className='admin-container'>
                                <div className='admin-content'>
                                  {/* Sidebar displaying admin user's info and allow fast travel to manage users/listings */}
                                    <div className='admin-sidebar'>
                                        <div className='admin-sidebar-card'>
                                            <img src={user?.picture} alt='profile' />
                                            <p className='name'>{user?.name}</p>
                                            <p className='sub'>{user?.email} (Admin)</p>
                                            <hr></hr>
                                            <div className='actions'>
                                                <button id={`${desiredView === 'dashboard' ? 'active' : null}`} onClick={() => { setDesiredView('dashboard') }}><FontAwesomeIcon className='inner-icon' icon={faHome} /> Dashboard</button>
                                                <button id={`${desiredView === 'users' ? 'active' : null}`} onClick={() => { setDesiredView('users') }}><FontAwesomeIcon className='inner-icon' icon={faUser} /> Users</button>
                                                <button id={`${desiredView === 'listings' ? 'active' : null}`} onClick={() => { setDesiredView('listings') }}><FontAwesomeIcon className='inner-icon' icon={faList} /> Listings</button>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Dashboard / Users / Listings view of the portal */}
                                    <div className='admin-main'>
                                        <div className='admin-card'>
                                            <div className='admin-card-header'>
                                                <FontAwesomeIcon icon={desiredView === 'dashboard' ? faHome : desiredView === 'users' ? faUser : desiredView === 'listings' ? faList : faCog} />
                                                <h2 className='current-view'>
                                                    {desiredView === 'dashboard' && 'Dashboard'}
                                                    {desiredView === 'users' && 'Users'}
                                                    {desiredView === 'listings' && 'Listings'}
                                                </h2>
                                            </div>
                                            {/* Render desired component based on selected view */}
                                            {desiredView === 'dashboard' && <Dashboard name={user?.name ?? ''} desiredView={desiredView} setDesiredView={setDesiredView} />}
                                            {desiredView === 'users' && <Users />}
                                            {desiredView === 'listings' && <Listings />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        : <AuthDenied message={'You don\'t have sufficient access to view this page. If you believe this is an error, please contact us.'} permissions={permissions} />
                      : <div className='access-container'>
                        <AuthDenied message='You need to be logged in to access this page. If you continue to see this error, please try again later.' permissions={permissions} />
                      </div>
                }
                {/* Display message to mobile users (Portal not available) */}
                <div className='admin-no-mobile'>
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                    <h2>Admin Portal</h2>
                    <p>Admin Portal is not available on mobile devices. Please use a desktop or laptop to access this feature.</p>
                </div>
            </header>
        </div>
  )
}

export default Admin
