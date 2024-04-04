import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import '../style/Home.css'
import Nav from './Nav'
import Filter from '../components/Filter'
import Listings from '../components/Listings'
import FilterMobile from '../components/FilterMobile'
import { useApi } from '../context/APIContext'
import { convertType, type ListingInfo } from '../types/listings'

const PLACEHOLDER_IMAGE = '/assets/placeholder.jpg'

// Defining Homepage HTML of site
const Home = (): React.ReactElement => {
  const [listings, setListings] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [p] = useSearchParams()
  const [filters, setFilters] = useState<any>({
    location: '',
    adType: [],
    sort: ''
  })
  const { sendRequest } = useApi()

  // Fetch the images for a listing from server
  const getImage = async (id: string): Promise<string[]> => {
    try {
      const { status, response } = await sendRequest<string[]>({
        method: 'GET',
        endpoint: `post/image/${id}`
      })

      if (status !== 200) {
        console.error('Images not found')
        return []
      }

      // Return placeholder image if no image available
      if (response.length === 0) {
        return [PLACEHOLDER_IMAGE]
      } else {
        return response
      }
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  }

  // Fetch listings based on current filter set by user (E.g. Type, Location, Price/Date sorting)
  const getListings = async (): Promise<ListingInfo[]> => {
    try {
      const title = p.get('title') !== null ? p.get('title') : ''
      const location = filters.location.trim()
      const adTypes = filters.adType
      const sortBy = filters.sort

      // Apply filters
      let url: string = 'post?'
      if (title !== '') {
        url += `&title=${title}`
      }
      if (location !== '') {
        url += `&location=${location}`
      }
      if (adTypes.length > 0) {
        url += `&adType=${adTypes}`
      }
      if (sortBy !== '') {
        url += `&sort=${sortBy}`
      }

      // Get listings from server
      const { status, response } = await sendRequest<ListingInfo[]>({
        method: 'GET',
        endpoint: url
      })
      if (status !== 200) {
        console.error('Details not found')
        return []
      }
      return response
    } catch (error) {
      console.error('Error fetching details:', error)
      return []
    }
  }

  // Fetch and render listings and their images based on filters given
  useEffect(() => {
    const renderPosts = async (): Promise<any> => {
      setIsLoading(true)
      const posts = await getListings()
      try {
        const newListings = await Promise.all(posts.map(async (post: ListingInfo) => {
          const img = await getImage(post.id.toString())
          return {
            ...post,
            adType: await convertType(post.adType),
            imgPaths: img,
            price: parseFloat(post.price)
          }
        }))
        setIsLoading(false)
        setListings(newListings)
      } catch (error) {
        console.log('Failed to render listings', error)
      }
    }
    void renderPosts()
  }, [filters, p])

  // Render component
  return (
        <div className="App">
            <header className="App-header">
                <Nav/>
                <div className='content'>
                  <Filter setFilters={setFilters}/>
                  <FilterMobile setFilters={setFilters}/>
                  {
            isLoading
              ? <div className='no-listings' id='home-load'>
                  <div className='loading-content'>
                    <span className="loader"></span>
                  </div>
                </div>
              : <Listings response={listings} isProfile={false}/>
          }
                </div>
            </header>
        </div>
  )
}

export default Home
