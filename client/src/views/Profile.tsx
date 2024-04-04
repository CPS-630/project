import React, { useCallback, useEffect, useState } from 'react'
import Nav from './Nav'
import '../style/Profile.css'
import Listings from '../components/Listings'
import { useAuth0, withAuthenticationRequired } from '@auth0/auth0-react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { useApi } from '../context/APIContext'
import { type ListingInfo } from '../types/listings'

const PLACEHOLDER_IMAGE = '/assets/placeholder.jpg'

interface ProfileInfo {
  phoneNumber: string
  major: string
  year: number
}

const Profile = (): React.ReactElement => {
  const { user, isLoading } = useAuth0()
  const [isFetchingPosts, setIsFetchingPosts] = useState(true)
  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [userListings, setUserListings] = useState<any[]>([])
  const [profileInfo, setProfileInfo] = useState<ProfileInfo>({
    phoneNumber: '',
    major: '',
    year: 1
  })
  const { sendRequest } = useApi()

  const validateProfile = (): boolean => {
    return profileInfo.phoneNumber.length === 12 &&
    profileInfo.major.length > 0 &&
    /^\+[0-9]{10,15}$/.test(profileInfo.phoneNumber)
  }

  const formatPhoneNumber = (phoneNumber: string): string => {
    // format phone number to +1 (555) 555-5555
    if (phoneNumber.length === 11) {
      return `+1 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)} ${phoneNumber.slice(7)}`
    } else {
      return phoneNumber
    }
  }
  const convertType = async (input: string): Promise<string> => {
    if (input === 'W') {
      return 'Wanted'
    } else if (input === 'A') {
      return 'Academic Service'
    } else {
      return 'Selling'
    }
  }

  const getImage = async (id: string): Promise<string[]> => {
    try {
      const { status, response } = await sendRequest<string[]>({
        method: 'GET',
        endpoint: `post/image/${id}`
      })

      if (status !== 200) {
        console.error('Images not found')
        return [PLACEHOLDER_IMAGE]
      }
      if (response.length === 0) {
        return [PLACEHOLDER_IMAGE]
      } else {
        return response
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      return [PLACEHOLDER_IMAGE]
    }
  }

  const getUserListings = async (): Promise<ListingInfo[]> => {
    try {
      const { status, response } = await sendRequest<ListingInfo[]>({
        method: 'GET',
        endpoint: 'post/user'
      })

      if (status !== 200) {
        console.error('Listings not found')
        return []
      }
      return response
    } catch (error) {
      console.error('Error fetching details:', error)
      return []
    }
  }

  useEffect(() => {
    const renderPosts = async (): Promise<any> => {
      setIsFetchingPosts(true)
      const posts = await getUserListings()
      try {
        const newListings = await Promise.all(posts.map(async (post: ListingInfo) => {
          const img = await getImage(post.id.toString())
          return {
            id: post.id,
            title: post.title,
            adType: await convertType(post.adType),
            imgPaths: img,
            description: post.description,
            location: post.location,
            categories: post.categories,
            price: parseFloat(post.price),
            postDate: post.postDate
          }
        }))
        setIsFetchingPosts(false)
        setUserListings(newListings)
      } catch {
        setIsFetchingPosts(false)
      }
    }
    void renderPosts()
  }, [])

  const toggleEditing = async (): Promise<void> => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }

    const { status } = await sendRequest({
      method: isFirstTime ? 'PUT' : 'POST',
      endpoint: isFirstTime ? 'user/setup' : 'user/update',
      body: profileInfo
    })
    setIsEditing(status !== 200 && status !== 201)
    window.location.reload()
  }

  const handleInputChange = (e: any): void => {
    const { name, value } = e.target
    setProfileInfo(prevState => ({
      ...prevState,
      [name]: name === 'year' ? Number(value) : value
    }))
  }

  if (isLoading) {
    return (
      <div className='App'>
        <header className='App-header'>
          <Nav />
          <div className='content profile'>
            <div className='container profile'>
              <div className='profile-information'>
                <div className='top-row'>
                  <div className='left'>
                    <h2>Profile Information</h2>
                    <p>Personalize your profile here.</p>
                  </div>
                  <div className='right'>
                    <FontAwesomeIcon icon={faEdit} />
                  </div>
                </div>
                <img src={'/assets/placeholder.jpg'} alt={'placeholder imag'} />
                <div className='profile-info'>
                  <h3 className='loading'></h3>
                  <p className='loading p'></p>
                </div>
              </div>
            </div>
            <Listings response={[]} isProfile={false} />
          </div>
        </header>
      </div>
    )
  }

  function getOrdinalIndicator (year: number): string {
    const lastDigit = year % 10
    const lastTwoDigits = year % 100

    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return 'th'
    }

    switch (lastDigit) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }

  const healthCheck = useCallback(async () => {
    const { status, response } = await sendRequest<ProfileInfo>({
      method: 'GET',
      endpoint: `user/${user?.sub}`
    })
    setIsFirstTime(status === 404)
    if (status === 200) {
      setProfileInfo(response)
    }
  }, [user])

  useEffect(() => {
    void healthCheck()
  }, [healthCheck])

  return (
    <div className='App'>
      <header className='App-header'>
        <Nav />
        <div className='content profile'>
          <div className='container profile'>
            <div className='profile-information'>
              <div className='top-row'>
                <div className='left'>
                  <h2>Profile Information</h2>
                  <p>Personalize your profile here.</p>
                </div>
                <div className='right'>
                  <FontAwesomeIcon icon={faEdit} onClick={() => { toggleEditing().catch(console.error) }}/>
                </div>
              </div>
              {
                isFirstTime
                  ? <div className='first-time' onClick={() => { toggleEditing().catch(console.error) }}>
                    <div className='left'>
                      <FontAwesomeIcon icon={faInfoCircle} bounce className='first-time-icon' />
                    </div>
                    <div className='right'>
                      <h5>Welcome to TMU Connect</h5>
                      <p>{'It looks like this is your first time here. For full access, click here to setup your account.'}</p>
                    </div>
                  </div>
                  : null
              }
              <img src={user?.picture} alt={user?.name} />
              <div className='profile-info'>
                <h3>{user?.name}</h3>
                <p>{user?.email}</p>
              </div>
              <div className='more-about-profile'>
                {
                  isEditing
                    ? <div className='edit-profile'>
                      <h5>Account Setup</h5>
                      <label htmlFor='year'>Year</label>
                      <input type='number' name='year' placeholder='Year' min={1} max={6} value={profileInfo.year} onChange={handleInputChange} />
                      <label htmlFor='major'>Major</label>
                      <input type='text' name='major' placeholder='Major' value={profileInfo.major} onChange={handleInputChange} />
                      <label htmlFor='phoneNumber'>Phone Number</label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={`${profileInfo.phoneNumber.length === 0 ? '+1' : ''}${profileInfo.phoneNumber}`}
                        onChange={handleInputChange}
                        placeholder="Phone Number"
                      />
                      <button
                      className={`${validateProfile() ? 'ready' : ''}`}
                      onClick={() => {
                        if (validateProfile()) {
                          toggleEditing().catch(console.error)
                        }
                      }}>
                      Save
                      </button>
                    </div>
                    : <div className='profile-info'>
                        <div className='program-row'>
                            {
                            isFirstTime
                              ? <p>Click the <strong>prompt</strong> above to setup your account.</p>
                              : <p><strong>{`${profileInfo.year}${getOrdinalIndicator(profileInfo.year)} Year`}</strong>:</p>
                            }
                          <p>{profileInfo.major}</p>
                        </div>
                        <p>{formatPhoneNumber(profileInfo.phoneNumber)}</p>
                      </div>
                }
              </div>
            </div>
          </div>
          {
            isFetchingPosts
              ? <div className='no-listings' id='home-load'>
                  <div className='loading-content'>
                    <span className="loader"></span>
                  </div>
                </div>
              : <Listings response={userListings} isProfile={true} />
          }
        </div>
      </header>
    </div>
  )
}

export default withAuthenticationRequired(Profile, {
  // Show a message while the user waits to be redirected to the login page.
  onRedirecting: () => (
    <div className='App'>
      <header className='App-header'>
        <Nav />
        <div className='content profile'>
          <div className='container profile'>
            <div className='profile-information'>
              <div className='top-row'>
                <div className='left'>
                  <h2>Profile Information</h2>
                  <p>Personalize your profile here.</p>
                </div>
                <div className='right'>
                  <FontAwesomeIcon icon={faEdit} />
                </div>
              </div>
              <img src={'/assets/placeholder.jpg'} alt={'placeholder imag'} />
              <div className='profile-info'>
                <h3 className='loading'></h3>
                <p className='loading p'></p>
              </div>
            </div>
          </div>
          <Listings response={[]} isProfile={false} />
        </div>
      </header>
    </div>
  )
})
