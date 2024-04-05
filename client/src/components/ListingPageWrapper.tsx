import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ListingPage from '../views/ListingPage'
import { convertType } from '../types/listings'
import { useApi } from '../context/APIContext'
import { type DetailedListing, type UserInfo } from '../types/user'

interface EnhancedListingInfo {
  id: number
  title: string
  adType: string
  imgPaths: string[]
  userID: string
  userName: string
  description: string
  location: string
  categories: string[]
  price: number
  postDate: string
  daysAgo: string
  isProfile: boolean
}

const ListingPageWrapper: React.FC = () => {
  const initialListingInfo: EnhancedListingInfo = {
    id: 0,
    title: '',
    adType: '',
    imgPaths: [],
    userID: '',
    userName: '',
    description: '',
    location: '',
    categories: [],
    price: 0,
    postDate: '',
    daysAgo: '',
    isProfile: false
  }
  const [listingDetails, setDetails] = useState<EnhancedListingInfo>(initialListingInfo)
  const { id } = useParams<{ id: string }>()
  const { sendRequest } = useApi()

  const getDaysAgo = async (dateString: string): Promise<string> => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays.toString()
  }

  const getDetails = async (): Promise<DetailedListing | undefined> => {
    try {
      const { status, response, error } = await sendRequest<DetailedListing>({
        method: 'GET',
        endpoint: `post/details/${id}`
      })
      if (status !== 200) {
        console.error(`Details not found: ${error}`)
        return
      }
      return response
    } catch (error) {
      console.error('Error fetching details:', error)
    }
  }

  const getImages = async (): Promise<string[]> => {
    try {
      const { status, response, error } = await sendRequest<string[]>({
        method: 'GET',
        endpoint: `post/image/${id}`
      })

      if (status !== 200) {
        console.error(`Details not found: ${error}`)
        return []
      }
      return response
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }

  const getUserName = async (userID: string): Promise<string> => {
    try {
      const { status, response, error } = await sendRequest<UserInfo>({
        method: 'GET',
        endpoint: `user/${userID}`
      })

      if (status !== 200) {
        console.error(`User not found: ${error}`)
        return ''
      }
      return `${response.firstName} ${response.lastName}`
    } catch (error) {
      console.error('Error fetching user:', error)
      return ''
    }
  }

  useEffect(() => {
    const fillDetails = async (): Promise<void> => {
      const listingD = await getDetails()
      if (listingD === undefined) {
        return
      }
      const imageD = await getImages()
      setDetails({
        id: listingD.id,
        title: listingD.title,
        adType: await convertType(listingD.adType),
        imgPaths: imageD,
        userID: listingD.user.id,
        userName: await getUserName(listingD.user.id),
        description: listingD.description,
        location: listingD.location,
        categories: listingD.categories,
        price: parseFloat(listingD.price),
        postDate: listingD.postDate,
        daysAgo: await getDaysAgo(listingD.postDate),
        isProfile: false
      })
    }
    void fillDetails()
  }, [])

  if (Object.keys(listingDetails).length === 0) {
    return <div>No listing details provided.</div>
  }
  return <ListingPage {...listingDetails} />
}

export default ListingPageWrapper
