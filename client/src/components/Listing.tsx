import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../style/Listings.css'
import type { ListingProps } from '../views/ListingPage'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faTrash } from '@fortawesome/free-solid-svg-icons'
import { useApi } from '../context/APIContext'

function calculateDaysAgo (dateString: string): string {
  const date = new Date(dateString)
  const today = new Date()
  const diffTime = today.getTime() - date.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays.toString()
}

const Listing: React.FC<ListingProps> = ({
  id, title, adType,
  imgPaths, description, location, categories, price, postDate, isProfile
}): React.ReactElement => {
  const navigate = useNavigate()
  const daysAgo = calculateDaysAgo(postDate).toString()
  const categoriesString = categories.join(', ')
  const [deleted, setDeleted] = useState(false)
  const { sendRequest } = useApi()
  const handleListingClick = (): void => {
    navigate(`/listing/${id}`)
  }

  async function deletePost (): Promise<void> {
    const { status, error } = await sendRequest({
      method: 'DELETE',
      endpoint: `post/${id}`
    })
    if (status !== 200) {
      console.error(`Ad could not be deleted: ${error}`)
    } else {
      setDeleted(true)
    }
  }

  if (deleted) {
    return <></>
  }

  return (
      <div className='listing'>
        <div id='img-container' onClick={handleListingClick}>
            <img src={`${imgPaths[0]}`} alt='ad' />
        </div>
        <div className='ad-content' onClick={handleListingClick}>
            <div className='top'>
                <p id='price'>${price % 1 !== 0 ? price.toFixed(2) : price + '.00'}</p>
                <h3>{title}</h3>
                <div className='sub-info'>
                    <p>{location}</p>
                    <p>|</p>
                    <p>{categoriesString}</p>
                </div>
                <p id='description'>{description}</p>
            </div>
            <div className='post-info'>
                <FontAwesomeIcon icon={faClock} />
                <p>{parseInt(daysAgo)} {parseInt(daysAgo) !== 1 ? 'days' : 'day'} ago</p>
                <p>|</p>
                <p>{adType}</p>
            </div>
        </div>
        {
        isProfile
          ? <div className='delete-button'>
              <FontAwesomeIcon title='Delete Listing' icon={faTrash} onClick={() => { void deletePost() }}/>
            </div>
          : <></>
        }
      </div>
  )
}

export default Listing
