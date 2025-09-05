import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: any
  }
}

export type PlayerStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; deviceId: string }
  | { kind: 'not_ready'; deviceId?: string }
  | { kind: 'error'; message: string }

export function useSpotifyPlayer(params: { getToken: () => Promise<string> | string }) {
  const { getToken } = params
  const [status, setStatus] = useState<PlayerStatus>({ kind: 'idle' })
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const playerRef = useRef<any | null>(null)
  const [state, setState] = useState<any | null>(null)

  const loadSdk = useCallback(() => {
    if (window.Spotify) return
    const script = document.createElement('script')
    script.id = 'spotify-sdk'
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const initializePlayer = useCallback(async () => {
    try {
      setStatus({ kind: 'loading' })
      const token = await Promise.resolve(getToken())
      if (!token) throw new Error('Missing access token')

      playerRef.current = new window.Spotify.Player({
        name: 'Gesture Player',
        getOAuthToken: (cb: (token: string) => void) => cb(token),
        volume: 0.5,
      })

      const player = playerRef.current

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        setStatus({ kind: 'ready', deviceId: device_id })
      })

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        setStatus({ kind: 'not_ready', deviceId: device_id })
      })

      player.addListener('player_state_changed', (playerState: any) => {
        setState(playerState)
      })

      player.addListener('initialization_error', ({ message }: { message: string }) => {
        setStatus({ kind: 'error', message })
      })
      player.addListener('authentication_error', ({ message }: { message: string }) => {
        setStatus({ kind: 'error', message })
      })
      player.addListener('account_error', ({ message }: { message: string }) => {
        setStatus({ kind: 'error', message })
      })

      const connected = await player.connect()
      if (!connected) setStatus({ kind: 'error', message: 'Failed to connect player' })
    } catch (e: any) {
      setStatus({ kind: 'error', message: e?.message ?? 'Unknown error' })
    }
  }, [getToken])

  useEffect(() => {
    loadSdk()
    const onReady = () => {
      // SDK global is ready; wait for login to init player
    }
    window.onSpotifyWebPlaybackSDKReady = onReady
    return () => {
      window.onSpotifyWebPlaybackSDKReady = undefined
    }
  }, [loadSdk])

  const login = useCallback(async () => {
    // Replace with real redirect to backend /login; for now mark logged in
    setIsLoggedIn(true)
    // Initialize player after logical login
    if (window.Spotify) {
      await initializePlayer()
    } else {
      // wait a tick for sdk script
      const id = setInterval(async () => {
        if (window.Spotify) {
          clearInterval(id)
          await initializePlayer()
        }
      }, 200)
      setTimeout(() => clearInterval(id), 10000)
    }
  }, [initializePlayer])

  const logout = useCallback(() => {
    setIsLoggedIn(false)
    setStatus({ kind: 'idle' })
    try {
      playerRef.current?.disconnect()
    } catch {}
    playerRef.current = null
  }, [])

  const controls = useMemo(() => ({
    play: async () => playerRef.current?.resume?.(),
    pause: async () => playerRef.current?.pause?.(),
    next: async () => playerRef.current?.nextTrack?.(),
    previous: async () => playerRef.current?.previousTrack?.(),
    togglePlay: async () => playerRef.current?.togglePlay?.(),
    setVolume: async (v: number) => playerRef.current?.setVolume?.(Math.min(1, Math.max(0, v))),
  }), [])

  return { status, state, isLoggedIn, login, logout, controls }
}


