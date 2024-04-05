import React, { useState, useEffect } from 'react'
import ReactPaginate from 'react-paginate'
import './style/Listings.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import { useApi } from '../../context/APIContext'
import { type ListingInfo } from '../../types/listings'

const Listings = (): React.ReactElement => {
  const [posts, setPosts] = useState<ListingInfo[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [queryActive, setQueryActive] = useState(false)
  const { sendRequest } = useApi()
  const itemsPerPage = 10

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    if (e.target.name === 'filter') {
      setFilter(e.target.value)
    } else if (e.target.name === 'search-query') {
      setInputText(e.target.value)
    }
  }

  const fetchPosts = async (): Promise<void> => {
    try {
      const { status, response, error } = await sendRequest<ListingInfo[]>({
        method: 'GET',
        endpoint: `post${query}`
      })

      if (status !== 200) {
        console.log(`Could not retrieve posts: ${error}`)
        return
      }
      setPosts(response)
      if (query !== '') {
        setQueryActive(true)
      }
      setIsLoading(false)
    } catch (error) {
      console.error(error)
    }
  }

  async function deletePost (postID: number): Promise<void> {
    const { status, error } = await sendRequest({
      method: 'DELETE',
      endpoint: `post/${postID}`
    })
    if (status !== 200) {
      console.error(`Ad could not be deleted; ${error}`)
    } else {
      void fetchPosts()
    }
  }

  useEffect(() => {
    fetchPosts().catch(console.error)
  }, [query])

  const handleSearch = (): void => {
    if ((filter !== '') && (inputText !== '')) {
      const newQuery = `?${filter}=${inputText}`
      setQuery(newQuery) // Set the query for fetching posts
    } else {
      // Handle the case where filter or inputText might not be set
      console.log('Please select a filter and enter a query')
    }
  }

  const handleClearSearch = (): void => {
    setQueryActive(false)
    setQuery('')
  }

  const handlePageChange = ({ selected }: { selected: number }): void => {
    setCurrentPage(selected)
  }
  const indexOfLastItem = (currentPage + 1) * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = posts.slice(indexOfFirstItem, indexOfLastItem)

  const totalResultsText = currentPage === Math.ceil(posts.length / itemsPerPage) - 1
    ? `Displaying ${posts.length} of ${posts.length} results`
    : `Displaying ${currentItems.length} of ${posts.length} results`

  return (
    <div className='listing-container'>
      <div className='listing-header'>
        <div className='search'>
          <select name='filter' id='filter' onChange={handleInputChange}>
            <option value='' selected disabled hidden>Filter by...</option>
            <option value='category'>Category</option>
            <option value='location'>Location</option>
            <option value='adType'>Ad Type</option>
            <option value='title'>Title</option>
          </select>
          <input className={`${filter === '' ? 'disabled' : null}`} name='search-query' onChange={handleInputChange} type='text' placeholder={`Search by ${filter}...`} />
          <button onClick={handleSearch}>Search</button>
        </div>
        {
          queryActive
            ? <button className='clear-search' onClick={() => { handleClearSearch() }}>Clear Search</button>
            : null
        }
        <p>{totalResultsText}</p>
      </div>
      <div className='listing-table'>
        <ReactPaginate
          nextLabel={<FontAwesomeIcon icon={faArrowRight} />}
          previousLabel={<FontAwesomeIcon icon={faArrowLeft} />}
          pageCount={Math.ceil(posts.length / itemsPerPage)}
          pageRangeDisplayed={5}
          marginPagesDisplayed={2}
          onPageChange={handlePageChange}
          forcePage={currentPage}
          containerClassName={'pagination'}
          activeClassName={'active'}
        />
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Post Date</th>
              <th>Title</th>
              <th>Location</th>
              <th>Categories</th>
              <th>Price</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {
              posts.length === 0
                ? <tr>
                  {
                    isLoading
                      ? <td colSpan={7}>Loading...</td>
                      : <td colSpan={7}>No posts available</td>
                  }
                  </tr>
                : currentItems.map((post) => (
                    <tr key={post.id}>
                      <td>{post.id}</td>
                      <td>{post.postDate}</td>
                      <td>{post.title}</td>
                      <td>{post.location}</td>
                      <td>{post.categories.join(', ')}</td>
                      <td>${post.price}</td>
                      <td>
                        <FontAwesomeIcon title='Delete Listing' icon={faTimesCircle} onClick={() => { void deletePost(post.id) }} />
                      </td>
                    </tr>
                ))
            }
          </tbody>
        </table>
        <ReactPaginate
          nextLabel={<FontAwesomeIcon icon={faArrowRight} />}
          previousLabel={<FontAwesomeIcon icon={faArrowLeft} />}
          pageCount={Math.ceil(posts.length / itemsPerPage)}
          pageRangeDisplayed={5}
          marginPagesDisplayed={2}
          onPageChange={handlePageChange}
          forcePage={currentPage}
          containerClassName={'pagination'}
          activeClassName={'active'}
          className='pagination bottom-pagination'
        />
      </div>
    </div>
  )
}

export default Listings
