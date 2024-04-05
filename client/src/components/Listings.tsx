import React, { useState } from 'react'
import ReactPaginate from 'react-paginate'
import Listing from './Listing'
import type { ListingProps } from '../views/ListingPage'
import '../style/Listings.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons'

interface ListingsComponentProps {
  response: ListingProps[]
  isProfile: boolean
}

const Listings: React.FC<ListingsComponentProps> = ({ response, isProfile }) => {
  const [currentPage, setCurrentPage] = useState(0)
  const itemsPerPage = 10

  const handlePageChange = ({ selected }: { selected: number }): void => {
    setCurrentPage(selected)
  }

  const indexOfLastItem = (currentPage + 1) * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = response.slice(indexOfFirstItem, indexOfLastItem)

  const totalResultsText = currentPage === Math.ceil(response.length / itemsPerPage) - 1
    ? `Displaying ${response.length} of ${response.length} results.`
    : `Displaying ${currentItems.length} of ${response.length} results.`
  return (
    <div className='listings'>
      <h2>Listings</h2>
      <div className='page-row'>
        <p className='results'>{totalResultsText}</p>
        <ReactPaginate
          nextLabel={<FontAwesomeIcon icon={faArrowRight} />}
          previousLabel={<FontAwesomeIcon icon={faArrowLeft} />}
          pageCount={Math.ceil(response.length / itemsPerPage)}
          pageRangeDisplayed={5}
          marginPagesDisplayed={2}
          onPageChange={handlePageChange}
          forcePage={currentPage}
          containerClassName={'pagination'}
          activeClassName={'active'}
        />
      </div>
      <div className='list'>
        {
          response.length === 0
            ? <div className='no-listings'>
                <p>No listings found.</p>
              </div>
            : currentItems.map(item => (
              <Listing
                key={item.id}
                id={item.id}
                title={item.title}
                userID={item.userID}
                userName={item.userName}
                adType={item.adType}
                imgPaths={item.imgPaths}
                description={item.description}
                location={item.location}
                categories={item.categories}
                price={item.price}
                postDate={item.postDate}
                isProfile={isProfile}
              />
            ))
        }
      </div>
      <div className='page-row bottom'>
        <ReactPaginate
          nextLabel={<FontAwesomeIcon icon={faArrowRight} />}
          previousLabel={<FontAwesomeIcon icon={faArrowLeft} />}
          pageCount={Math.ceil(response.length / itemsPerPage)}
          pageRangeDisplayed={5}
          marginPagesDisplayed={2}
          onPageChange={handlePageChange}
          forcePage={currentPage}
          containerClassName={'pagination'}
          activeClassName={'active'}
        />
      </div>
    </div>
  )
}

export default Listings
