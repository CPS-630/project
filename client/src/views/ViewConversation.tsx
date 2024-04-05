import React, { useState, useEffect, useRef } from 'react'
import Nav from './Nav'
import { useAuth0 } from '@auth0/auth0-react'
import { useLocation } from 'react-router-dom'
import { useApi } from '../context/APIContext'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faComments, faPaperPlane } from '@fortawesome/free-solid-svg-icons'
import { type DetailedListing, type UserInfo } from '../types/user'

export interface Message {
  id: number
  conversationId: number
  senderId: string
  content: string
  senderName: string
  senderImage: string
  postName: string
  postPrice: number
  sentAt: string
}

export interface Conversation {
  id: number
  postId: number
  senderName: string
  senderImage: string
  sellerId: string
  buyerId: string
  postName: string
  postPrice: number
}

const ViewConversation = (): React.ReactElement => {
  const { user, isLoading } = useAuth0()
  const { sendRequest } = useApi()
  const [messages, setMessages] = useState<Message[]>([])
  const [isFetching, setIsFetching] = useState(true)
  const location = useLocation()
  const conversation = location.state.conversation as Conversation
  const inputRef = useRef<any>()
  const conversationId = conversation.id

  const getMessages = async (isFetching: boolean = true): Promise<Message[]> => {
    setIsFetching(isFetching)
    try {
      const { status, response, error } = await sendRequest<Message[]>({
        method: 'GET',
        endpoint: `message/${conversationId}`
      })

      if (status !== 200) {
        console.error(`Messages not found for conversation ${conversationId}: ${error}`)
        return []
      }

      const enrichedMessages = await Promise.all(response.map(async (message) => {
        const userDetails = await getUser(message.senderId)
        const postDetails = await getPost(conversation.postId)
        return {
          ...message,
          senderName: userDetails.firstName + ' ' + userDetails.lastName,
          senderImage: userDetails.picture,
          postName: postDetails.title,
          postPrice: parseFloat(postDetails.price)
        }
      }))

      enrichedMessages.sort((a, b) => {
        return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
      }).reverse()
      setIsFetching(false)
      return enrichedMessages
    } catch (error) {
      console.error('Error fetching messages', error)
      return []
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      void getMessages(false).then(newMessages => {
        if (newMessages.length > 0) {
          setMessages(newMessages)
        }
      })
    }, 2000)

    return () => { clearInterval(interval) }
  }, [])

  async function getUser (senderId: string): Promise<UserInfo> {
    const { status, response, error } = await sendRequest<UserInfo>({
      method: 'GET',
      endpoint: `user/${senderId}`
    })

    if (status !== 200) {
      // Handle response errors
      throw new Error(`User not found for ID ${senderId}: ${error}`)
    }
    return response
  }

  const getPost = async (postId: number): Promise<DetailedListing> => {
    const { status, response, error } = await sendRequest<DetailedListing>({
      method: 'GET',
      endpoint: `post/details/${postId}`
    })

    if (status !== 200) {
      throw new Error(`Post not found for ID ${postId}: ${error}`)
    }
    return response
  }

  const handleSendMessage = async (): Promise<any> => {
    try {
      const { status, error } = await sendRequest({
        method: 'POST',
        endpoint: `message/${conversationId}`,
        body: {
          content: inputRef.current.value
        }
      })

      if (status !== 201) {
        console.error(`Error posting message to conversation ${conversationId}: ${error}`)
        return
      }
      const newMessages = await getMessages()
      if (newMessages.length > 0) {
        setMessages(newMessages)
      }
      if (inputRef.current.value !== null) inputRef.current.value = null
    } catch (error) {
      console.error('Error with message send fetch request: ', error)
    }
  }

  useEffect(() => {
    const renderMessages = async (): Promise<void> => {
      console.log('rendering messages')
      if (!isLoading) {
        const newMessages = await getMessages()
        if (messages !== newMessages) {
          setMessages(newMessages)
        }
      }
    }
    void renderMessages()
  }, [isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage().catch(error => { console.log(error) })
    }
  }

  const formatDate = (date: string): string => {
    const d = new Date(date)
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
    const optionsDate: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
    const optionsTime: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
    const formattedDate = d.toLocaleDateString('en-US', optionsDate)
    const formattedTime = d.toLocaleTimeString('en-US', optionsTime)
    return `${formattedDate} at ${formattedTime}`
  }

  if (isFetching) {
    return (
      <div className='App'>
        <header className='App-header'>
          <Nav />
          <div className='conversation-content'>
            <div className='conversation-header'>
              <h2>Chatting with {conversation.senderName}</h2>
              <div className='post-info'>
                <h3>{conversation.postName}</h3>
                <p>(${conversation.postPrice})</p>
              </div>
            </div>
            <div className='conversation-messages'>
              <div className='loading-content' id='message-load'>
                <span className="loader"></span>
              </div>
            </div>
            <div className='sendMessage'>
              <input type='text' ref={inputRef} placeholder='Send Message...' onKeyDown={handleKeyDown}/>
              <button onClick={() => { handleSendMessage().catch(error => { console.log(error) }) }}><FontAwesomeIcon icon={faPaperPlane} /></button>
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
            <div className='conversation-content'>
              <div className='conversation-header'>
                <h2>Chatting with {conversation.senderName}</h2>
                <div className='post-info'>
                  <h3>{conversation.postName}</h3>
                  <p>(${conversation.postPrice})</p>
                </div>
              </div>
              <div className='conversation-messages'>
                  { (Array.isArray(messages) && messages.length > 0)
                    ? (
                        messages.map((message: Message) => (
                          message.senderId === user?.sub
                            ? (
                        <div key={message.id} className='message self'>
                          <div className='message-container'>
                            <div className='sender-info'>
                              <img src={message.senderImage} alt='' />
                              <div className='sender-info-col'>
                                <h2>{message.senderName}</h2>
                                <p>{formatDate(message.sentAt)}</p>
                              </div>
                            </div>
                            <p id='message-content'>{message.content}</p>
                          </div>
                        </div>
                              )
                            : (
                              <div key={message.id} className='message'>
                              <div className='message-container'>
                                <div className='sender-info'>
                                  <img src={message.senderImage} alt='' />
                                  <div className='sender-info-col'>
                                    <h2>{message.senderName}</h2>
                                    <p>{formatDate(message.sentAt)}</p>
                                  </div>
                                </div>
                                <p id='message-content'>{message.content}</p>
                              </div>
                            </div>
                              )
                        ))
                      )
                    : (Array.isArray(messages) && messages.length === 0)
                        ? (
                            <div className='no-messages'>
                              <FontAwesomeIcon icon={faComments} />
                              <h2>No Messages</h2>
                              <p>Send a message to start the conversation!</p>
                            </div>
                          )
                        : (
                      <div>Error retrieving messages. Please wait a few moments and then refresh the page.</div>
                          )}
              </div>
              <div className='sendMessage'>
                <input type='text' ref={inputRef} placeholder='Send Message...' onKeyDown={handleKeyDown}/>
                <button onClick={() => { handleSendMessage().catch(error => { console.log(error) }) }}><FontAwesomeIcon icon={faPaperPlane} /></button>
              </div>
            </div>
            </header>
          </div>
  )
}

export default ViewConversation
