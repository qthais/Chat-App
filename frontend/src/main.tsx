import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ApolloProvider } from '@apollo/client'
import { client } from './apolloClient.ts'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { MantineProvider } from '@mantine/core'
import Home from './pages/home.tsx'
import JoinRoomOnWindow from './components/JoinRoomOnWindow.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    children:[
      {
        path:'/chatrooms/:id',
        element:<JoinRoomOnWindow/>
      }
    ]
  },

])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider>
      <ApolloProvider client={client}>
        <RouterProvider router={router} />
      </ApolloProvider>
    </MantineProvider>
  </StrictMode>
)
