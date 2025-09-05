import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void
    Spotify?: any
  }
}

type PlayerStatus =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; deviceId: string }
  | { kind: 'not_ready'; deviceId?: string }
  | { kind: 'error'; message: string }

type SpotifyContextShape = {
  token: string | null
  isLoggedIn: boolean
  status: PlayerStatus
  playbackState: any | null
  login: () => void
  logout: () => void
  controls: {
    play: () => Promise<void> | void
    pause: () => Promise<void> | void
    next: () => Promise<void> | void
    previous: () => Promise<void> | void
    togglePlay: () => Promise<void> | void
    setVolume: (v01: number) => Promise<void> | void
  }
}

const SpotifyPlayerContext = createContext<SpotifyContextShape | undefined>(undefined)

function parseTokenFromUrl(): string | null {
  try {
    const url = new URL(window.location.href)
    const queryToken = url.searchParams.get('access_token')
    if (queryToken) return queryToken
    if (url.hash) {
      const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
      const hashToken = hash.get('access_token')
      if (hashToken) return hashToken
    }
  } catch {}
  return null
}

function useSpotifySdkScript(): void {
  useEffect(() => {
    if (window.Spotify) return
    // Define the global callback expected by the SDK to avoid reference errors
    if (typeof window.onSpotifyWebPlaybackSDKReady !== 'function') {
      window.onSpotifyWebPlaybackSDKReady = () => {}
    }
    const script = document.createElement('script')
    script.id = 'spotify-player'
    script.type = 'text/javascript'
    script.async = true
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    document.body.appendChild(script)
  }, [])
}

export function SpotifyPlayerProvider(props: { children: React.ReactNode; backendBaseUrl?: string }) {
  const { children, backendBaseUrl = 'http://localhost:8000' } = props
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('spotify_access_token'))
  const [status, setStatus] = useState<PlayerStatus>({ kind: 'idle' })
  const [playbackState, setPlaybackState] = useState<any | null>(null)
  const playerRef = useRef<any | null>(null)

  useSpotifySdkScript()

  // Capture token from redirect if present
  useEffect(() => {
    const t = parseTokenFromUrl()
    if (t) {
      localStorage.setItem('spotify_access_token', t)
      setToken(t)
      try {
        const url = new URL(window.location.href)
        url.searchParams.delete('access_token')
        url.hash = ''
        window.history.replaceState({}, document.title, url.toString())
      } catch {}
    }
  }, [])

  const initializePlayer = useCallback(async () => {
    if (!token || !window.Spotify || playerRef.current) return

    setStatus({ kind: 'loading' })
    const player = new window.Spotify.Player({
      name: 'Gestify Player',
      getOAuthToken: (cb) => cb(token),
      volume: 0.5,
    })

    player.addListener('ready', ({ device_id }) => {
      console.log('[Spotify SDK] ready', device_id)
      setStatus({ kind: 'ready', deviceId: device_id })
    })
    player.addListener('not_ready', ({ device_id }) => {
      console.warn('[Spotify SDK] not_ready', device_id)
      setStatus({ kind: 'not_ready', deviceId: device_id })
    })
    player.addListener('player_state_changed', (s) => {
      console.log('[Spotify SDK] state_changed', s)
      setPlaybackState(s)
    })
    player.addListener('initialization_error', ({ message }) => {
      console.error('[Spotify SDK] initialization_error', message)
      setStatus({ kind: 'error', message })
    })
    player.addListener('authentication_error', ({ message }) => {
      console.error('[Spotify SDK] authentication_error', message)
      setStatus({ kind: 'error', message })
      localStorage.removeItem('spotify_access_token')
      setToken(null)
    })
    player.addListener('account_error', ({ message }) => {
      console.error('[Spotify SDK] account_error', message)
      setStatus({ kind: 'error', message })
    })

    const connected = await player.connect()
    if (!connected) setStatus({ kind: 'error', message: 'Failed to connect player' })
    playerRef.current = player

    // Safety: if the SDK never emits ready/not_ready within 10s, surface an error
    setTimeout(() => {
      setStatus((current) => {
        if (current.kind === 'loading') {
          console.error('[Spotify SDK] timeout waiting for ready')
          return { kind: 'error', message: 'Timeout waiting for Spotify player readiness' }
        }
        return current
      })
    }, 10000)
  }, [token])

  // Initialize when SDK + token ready
  useEffect(() => {
    if (!token) return
    if (window.Spotify) {
      initializePlayer()
    } else {
      const id = setInterval(() => {
        if (window.Spotify) {
          clearInterval(id)
          initializePlayer()
        }
      }, 200)
      setTimeout(() => clearInterval(id), 10000)
    }
  }, [token, initializePlayer])

  const login = useCallback(() => {
    window.location.href = `${backendBaseUrl}/login`
  }, [backendBaseUrl])

  const logout = useCallback(() => {
    localStorage.removeItem('spotify_access_token')
    setToken(null)
    setStatus({ kind: 'idle' })
    try {
      playerRef.current?.disconnect()
    } catch {}
    playerRef.current = null
  }, [])

  const controls = useMemo(
    () => ({
      play: async () => playerRef.current?.resume?.(),
      pause: async () => playerRef.current?.pause?.(),
      next: async () => playerRef.current?.nextTrack?.(),
      previous: async () => playerRef.current?.previousTrack?.(),
      togglePlay: async () => playerRef.current?.togglePlay?.(),
      setVolume: async (v01: number) => playerRef.current?.setVolume?.(Math.min(1, Math.max(0, v01))),
    }),
    []
  )

  const value: SpotifyContextShape = {
    token,
    isLoggedIn: Boolean(token),
    status,
    playbackState,
    login,
    logout,
    controls,
  }

  return <SpotifyPlayerContext.Provider value={value}>{children}</SpotifyPlayerContext.Provider>
}

export function useSpotifyPlayerContext(): SpotifyContextShape {
  const ctx = useContext(SpotifyPlayerContext)
  if (!ctx) throw new Error('useSpotifyPlayerContext must be used within SpotifyPlayerProvider')
  return ctx
}


