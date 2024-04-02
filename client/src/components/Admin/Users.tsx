import React, { useState, useEffect } from 'react'
import ReactPaginate from 'react-paginate'
import { useAuth0 } from '@auth0/auth0-react'
import './style/Listings.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowRight, faArrowLeft, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

interface User {
  id: string
  name: string
  email: string
  year: number
  major: string
}

const Users = (): React.ReactElement => {
  const { user, getAccessTokenSilently } = useAuth0()
  const [users, setUsers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [inputText, setInputText] = useState('')
  const [filter, setFilter] = useState('')
  const [query, setQuery] = useState('')
  const [queryActive, setQueryActive] = useState(false)
  const [curUser, setCurUser] = useState('')
  const itemsPerPage = 10

  const getToken = async (): Promise<string> => {
    return await getAccessTokenSilently()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    if (e.target.name === 'filter') {
      setFilter(e.target.value)
    } else if (e.target.name === 'search-query') {
      setInputText(e.target.value)
    }
  }

  const fetchUsers = async (): Promise<void> => {
    const token = await getToken()
    try {
      const response = await fetch(`http://localhost:8080/user${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        const users = data.map((user: any) => ({
          id: user.id as string,
          name: user.firstName + ' ' + user.lastName,
          year: user.year,
          email: user.email,
          major: user.major
        }))
        setUsers(users)
        if (query !== '') {
          setQueryActive(true)
        }
        setIsLoading(false)
      } else {
        setUsers([])
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function deleteUser (userID: string): Promise<void> {
    const token = await getToken()
    void fetch(`http://localhost:8080/user/${userID}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(async response => {
        if (response.status !== 200) {
          console.error('User could not be deleted')
        } else {
          void fetchUsers()
        }
      })
  }

  useEffect(() => {
    fetchUsers().catch(console.error)
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
  const currentItems = users.slice(indexOfFirstItem, indexOfLastItem)

  const totalResultsText = currentPage === Math.ceil(users.length / itemsPerPage) - 1
    ? `Displaying ${users.length} of ${users.length} results`
    : `Displaying ${currentItems.length} of ${users.length} results`

  useEffect(() => {
    const getID = async (): Promise<void> => {
      const curID: string | undefined = user?.sub
      if (curID !== undefined) {
        setCurUser(curID)
        void fetchUsers()
      }
    }
    void getID()
  }, [query])

  return (
    <div className='listing-container'>
      <div className='listing-header'>
        <div className='search'>
          <select name='filter' id='filter' onChange={handleInputChange}>
            <option value='' selected disabled hidden>Filter by...</option>
            <option value='name'>Name</option>
            <option value='email'>Email</option>
            <option value='major'>Major</option>
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
          pageCount={Math.ceil(users.length / itemsPerPage)}
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
              <th>Name</th>
              <th>Email</th>
              <th>Year</th>
              <th>Major</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {
              users.length === 0
                ? <tr>
                  {
                    isLoading
                      ? <td colSpan={6}>Loading...</td>
                      : <td colSpan={6}>No users found</td>
                  }
                </tr>
                : currentItems.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.year}</td>
                      <td>{user.major}</td>
                      {
                        curUser !== user.id
                          ? <td>
                              <FontAwesomeIcon icon={faTimesCircle} title='Delete User' onClick={() => { void deleteUser(user.id) }} />
                            </td>
                          : <td></td>
                      }

                      {/* Add more table cells as needed */}
                    </tr>
                ))
            }
          </tbody>
        </table>
        <ReactPaginate
          nextLabel={<FontAwesomeIcon icon={faArrowRight} />}
          previousLabel={<FontAwesomeIcon icon={faArrowLeft} />}
          pageCount={Math.ceil(users.length / itemsPerPage)}
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

export default Users
