import React from 'react'
import { Home } from './pages/Home'
import { SpotifyPlayerProvider } from './context/SpotifyPlayerContext'

export function App() {
  return (
    <SpotifyPlayerProvider>
      <Home />
    </SpotifyPlayerProvider>
  )
}


