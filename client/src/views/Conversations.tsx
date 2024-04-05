import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Nav from './Nav'
import '../style/Conversations.css'
import type { Conversation } from './ViewConversation'
import { useAuth0 } from '@auth0/auth0-react'
import { useApi } from '../context/APIContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faTrash } from '@fortawesome/free-solid-svg-icons'
import { type ListingInfo } from '../types/listings'
import { type UserInfo } from '../types/user'

// You can add Messages to this import statement, so you can retrieve latest message for each conversation.
interface ConversationsProps {
  conversations?: Conversation[]
}

const Conversations: React.FC<ConversationsProps> = (): React.ReactElement => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [conversationsLoading, setConversationsLoading] = useState(true)
  const { user, isLoading } = useAuth0()
  const { sendRequest } = useApi()
  const navigate = useNavigate()

  const getConversations = async (): Promise<Conversation[]> => {
    setConversationsLoading(true)
    try {
      const { status, response } = await sendRequest<Conversation[]>({
        method: 'GET',
        endpoint: 'conversation/user'
      })

      if (status !== 200) {
        console.error(`Conversations not found for user ${user?.sub}`)
        return []
      }
      const conversations = await Promise.all(
        response.map(async (conversation: any) => {
          const currentUserId = user?.sub
          const isBuyer = currentUserId === conversation.buyerId
          const userResponse = await sendRequest<UserInfo>({
            method: 'GET',
            endpoint: `user/${isBuyer ? conversation.sellerId : conversation.buyerId}`
          })

          if (userResponse.status !== 200) {
            console.error(`Details not found for buyer ${conversation.buyerId}`)
            return conversation
          }

          const postResponse = await sendRequest<ListingInfo>({
            method: 'GET',
            endpoint: `post/details/${conversation.postId}`
          })

          const userDetails = userResponse.response
          const postDetails = postResponse.response
          return {
            ...conversation,
            senderName: userDetails.firstName + ' ' + userDetails.lastName,
            senderImage: userDetails.picture,
            postName: postDetails.title,
            postPrice: postDetails.price
          }
        })
      )
      setConversationsLoading(false)
      return conversations
    } catch (error) {
      console.error('Error fetching conversations', error)
      return []
    }
  }

  const handleClick = (conversation: Conversation): void => {
    navigate('/viewconversation', { state: { conversation } })
  }

  const handleDeleteConversation = async (conversation: Conversation): Promise<void> => {
    try {
      const { status } = await sendRequest<Conversation[]>({
        method: 'DELETE',
        endpoint: `conversation/post/${conversation.postId}`
      })

      if (status !== 200 && status !== 204) {
        console.error('Conversation not deleted', status)
        return
      }

      const updatedConversations = conversations.filter(c => c.id !== conversation.id)
      setConversations(updatedConversations)
      console.log('Conversation deleted')
    } catch (error) {
      console.error('Error deleting conversation', error)
    }
  }

  useEffect(() => {
    const renderConversations = async (): Promise<any> => {
      const newConversations = await getConversations()

      if (conversations !== newConversations) {
        setConversations(newConversations)
      }
    }

    if (!isLoading) { void renderConversations() }
  }, [isLoading])

  if (conversationsLoading) {
    return (
      <div className='App'>
        <header className='App-header'>
          <Nav />
          <div className='conversations container'>
            <div className='conversations-header'>
              <p id='breadcrumbs'> <Link id='back-to' to='/'>Home</Link> <FontAwesomeIcon icon={faChevronRight} /> Conversations</p>
              <h1>Conversations</h1>
              <p>View, chat, and manage your conversations.</p>
            </div>
            <div className='conversations-list'>
              <div className='loading-content'>
                <span className="loader"></span>
                <p>Loading your conversations...</p>
              </div>
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
        <div className='conversations container'>
          <div className='conversations-header'>
            <p id='breadcrumbs'> <Link id='back-to' to='/'>Home</Link> <FontAwesomeIcon icon={faChevronRight} /> Conversations</p>
            <h1>Conversations</h1>
            <p>View, chat, and manage your conversations.</p>
          </div>
          <div className='conversations-list'>
            {((conversations?.length) != null) && conversations.length > 0
              ? (
                  conversations.map((conversation: Conversation) => (
                <div key={conversation.id} className='conversation'>
                  <div className='conversation-left'>
                    <div className='conversation-header'>
                      <h2>Conversation with {conversation.senderName}</h2>
                    </div>
                    <div className='conversation-details'>
                      <img src={conversation.senderImage} alt='buyer' />
                      <div className='conversation-post-info'>
                        <p id='title'>{conversation.postName}</p>
                        <p id='price'>${conversation.postPrice}</p>
                      </div>
                    </div>
                  </div>
                  <div className='conversation-right'>
                    <button onClick={() => { handleClick(conversation) }}>View Messages</button>
                    <button onClick={() => { handleDeleteConversation(conversation).catch(error => { console.error(error) }) }}><FontAwesomeIcon icon={faTrash} /></button>
                  </div>
                </div>
                  ))
                )
              : (
              <p>No conversations found.</p>
                )}
          </div>
        </div>
      </header>
    </div>
  )
}

export default Conversations
