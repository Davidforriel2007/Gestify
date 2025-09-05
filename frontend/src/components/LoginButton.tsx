import React from 'react'
import { useSpotifyPlayerContext } from '../context/SpotifyPlayerContext'

export function LoginButton() {
  const { isLoggedIn, login } = useSpotifyPlayerContext()
  if (isLoggedIn) return null
  return (
    <button
      className="rounded-md bg-emerald-500/90 px-3 py-1 text-xs font-medium text-neutral-950 hover:bg-emerald-400"
      onClick={login}
    >
      Login with Spotify
    </button>
  )
}


