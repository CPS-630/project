import React from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './views/Home'
import NotFound from './views/NotFound'
import { Auth0Provider } from '@auth0/auth0-react'
import Profile from './views/Profile'
import Conversations from './views/Conversations'
import ViewConversation from './views/ViewConversation'
import PostAd from './views/PostAd'
import ListingPageWrapper from './components/ListingPageWrapper'
import Admin from './views/Admin'
import { ApiProvider } from './context/APIContext'

// Main app. Responsible for routing all pages
const App = (): React.ReactElement => {
  const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/profile', element: <Profile /> },
    { path: '/postad', element: <PostAd /> },
    { path: '/conversations', element: <Conversations /> },
    { path: '/viewconversation', element: <ViewConversation /> },
    { path: '/listing/:id', element: <ListingPageWrapper /> },
    { path: 'admin', element: <Admin /> },
    { path: '*', element: <NotFound /> }
  ])

  // Obtain Auth0 domain and client from env variables
  const domain = process.env.REACT_APP_DOMAIN ?? ''
  const clientId = process.env.REACT_APP_CLIENT_ID ?? ''
  return (
      <Auth0Provider
          domain={domain}
          clientId={clientId}
          authorizationParams={{
            redirect_uri: `${window.location.protocol}//${window.location.host}/profile`,
            scope: 'openid profile email read:message',
            audience: process.env.REACT_APP_BACKEND_AUDIENCE
          }}
      >
        <ApiProvider>
          <RouterProvider router={router} />
        </ApiProvider>
      </Auth0Provider>

  )
}

export default App
