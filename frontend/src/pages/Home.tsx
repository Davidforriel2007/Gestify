import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PlayerBar } from '../components/PlayerBar/PlayerBar'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { SongList } from '../components/SongList/SongList'
import { VolumeOverlay } from '../components/VolumeOverlay/VolumeOverlay'
import { useSpotifyPlayerContext } from '../context/SpotifyPlayerContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { searchAll, fetchPlaylistDetail, fetchPlaylists, type Playlist, type Track, type SearchResults } from '../hooks/useSpotifyApi'

export function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [volume, setVolume] = useState(35)
  const [volumeVisible, setVolumeVisible] = useState(false)
  const [gesturesEnabled, setGesturesEnabled] = useState(false)
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: '1', name: 'My Mix', tracksTotal: 0 },
    { id: '2', name: 'Chill Vibes', tracksTotal: 0 },
  ])
  const [search, setSearch] = useState('')
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null)
  const [tracks, setTracks] = useState<Track[] | undefined>(undefined)
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const latestTermRef = useRef<string>('')
  const debounceRef = useRef<number | null>(null)

  const { status, isLoggedIn, login, controls, token, playbackState } = useSpotifyPlayerContext()

  // Derive current song and playback metadata from SDK state
  const currentTrack = (playbackState as any)?.track_window?.current_track
  const derivedSong = useMemo(() => {
    if (!currentTrack) return null
    return {
      title: currentTrack?.name ?? '',
      artist: Array.isArray(currentTrack?.artists) ? currentTrack.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : '',
      coverUrl: currentTrack?.album?.images?.[0]?.url ?? '',
    }
  }, [currentTrack])
  const isActuallyPlaying = playbackState ? !(playbackState as any).paused : false
  const progressMs = (playbackState as any)?.position ?? 0
  const durationMs = currentTrack?.duration_ms ?? (playbackState as any)?.duration ?? 0

  // Smooth, real-time progress tracking independent of Spotify's state events
  const [displayProgressMs, setDisplayProgressMs] = useState<number>(0)
  useEffect(() => {
    // Reset displayed progress when SDK state reports a new position/track
    setDisplayProgressMs(progressMs)
  }, [progressMs, currentTrack?.id])

  useEffect(() => {
    if (!isActuallyPlaying) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = now - last
      last = now
      setDisplayProgressMs((p) => Math.min(typeof durationMs === 'number' ? durationMs : Number.MAX_SAFE_INTEGER, p + dt))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [isActuallyPlaying, durationMs])

  useEffect(() => {
    if (!volumeVisible) return
    const id = setTimeout(() => setVolumeVisible(false), 2500)
    return () => clearTimeout(id)
  }, [volumeVisible])

  useEffect(() => {
    if (!isLoggedIn || !selectedPlaylistId) return
    // For local playlists, tracks remain mocked; for Spotify playlist detail, fetch when selected from search
    setTracks(undefined)
  }, [isLoggedIn, selectedPlaylistId])

  useEffect(() => {
    const term = search.trim()
    latestTermRef.current = term
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    if (!term) {
      setSearchResults(null)
      return
    }
    // Require login/token to perform Spotify search
    if (!isLoggedIn || !token) {
      setSearchResults({ tracks: [], playlists: [] })
      return
    }
    // Debounce to reduce requests and avoid flicker while typing
    debounceRef.current = window.setTimeout(() => {
      const currentTerm = latestTermRef.current
      if (!currentTerm) return
      try { console.log('[Search] firing', currentTerm, { isLoggedIn, hasToken: Boolean(token) }) } catch {}
      setSearchLoading(true)
      searchAll(currentTerm)
        .then((r) => {
          // Only apply if the result is for the latest term
          if (latestTermRef.current === currentTerm) {
            setSearchResults(r)
            try { console.log('[Search] results', currentTerm, r?.tracks?.length, r?.playlists?.length) } catch {}
          }
        })
        .catch((e) => {
          try { console.error('[Search] error', e) } catch {}
          if (latestTermRef.current === currentTerm) setSearchResults({ tracks: [], playlists: [] })
        })
        .finally(() => {
          if (latestTermRef.current === currentTerm) setSearchLoading(false)
        })
    }, 250)
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [search, isLoggedIn, token])

  // WebSocket mappings (guarded by toggle to avoid unintended playback loops)
  useWebSocket('ws://127.0.0.1:8000/ws/gestures', {
    onTogglePlay: () => { controls.togglePlay?.() },
    onNext: () => { controls.next?.() },
    onPrevious: () => { controls.previous?.() },
    onVolume: (value: number) => {
      setVolume(value)
      setVolumeVisible(true)
      controls.setVolume?.(value / 100)
    },
  }, { enabled: gesturesEnabled })

  async function handleSelectHome() {
    try {
      const pls = await fetchPlaylists()
      const grid = pls.map((p) => ({ id: p.id, name: p.name, cover: p.images?.[1]?.url || p.images?.[0]?.url, tracksTotal: p.tracksTotal }))
      setSelectedPlaylistId(null)
      setTracks(undefined)
      setSearch('')
      setSearchResults({ tracks: [], playlists: grid })
    } catch (e) {
      try { console.error('[Home] failed to load playlists', e) } catch {}
      setSearchResults({ tracks: [], playlists: [] })
    }
  }

  return (
    <div className="h-screen bg-neutral-950 text-neutral-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        playlists={useMemo(() => playlists.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [playlists, search])}
        selectedPlaylistId={selectedPlaylistId}
        onSelectPlaylist={(id) => setSelectedPlaylistId(id)}
        onSelectHome={handleSelectHome}
        search={search}
        onSearchChange={setSearch}
      />

      <div className={'relative flex h-screen flex-col ' + (sidebarCollapsed ? 'ml-16' : 'ml-64')}>
      <PlayerBar
          song={derivedSong}
          isPlaying={isActuallyPlaying}
          onPlayPause={async () => { await controls.togglePlay?.() }}
        onPrev={async () => { await controls.previous?.() }}
        onNext={async () => { await controls.next?.() }}
        isLoggedIn={isLoggedIn}
        onLogin={() => login()}
        gesturesEnabled={gesturesEnabled}
        onToggleGestures={() => setGesturesEnabled((e) => !e)}
        statusText={
          isLoggedIn
              ? (status.kind === 'loading' && 'Initializing player...') ||
              (status.kind === 'not_ready' && 'Player not ready') ||
              (status.kind === 'error' && `Player error: ${status.message}`) || ''
            : ''
        }
          progressMs={displayProgressMs}
          durationMs={durationMs}
          onSeek={(ms) => { setDisplayProgressMs(ms); controls.seek?.(ms) }}
        />

        <main className="relative flex-1 overflow-y-auto scrollbar-hidden">
          <div className="px-4 py-3" />
        {searchResults ? (
            <SongList
              songs={(searchResults.tracks || []).map((t) => ({ id: t.id, title: t.title, artist: t.artist, coverUrl: t.albumArt }))}
              artists={(searchResults.artists || []).map((a) => ({ id: a.id, name: a.name, imageUrl: a.imageUrl }))}
              albums={(searchResults.albums || []).map((al) => ({ id: al.id, name: al.name, artist: al.artist, coverUrl: al.coverUrl }))}
              onPlaySong={(id) => {
                try {
                  const m = (searchResults.tracks || []).find((x) => x.id === id || x.uri === id)
                  const uri = m?.uri || (id.startsWith('spotify:') ? id : `spotify:track:${id}`)
                  controls.playUri?.(uri)
                    } catch {}
                  }}
            />
          ) : (
            <SongList songs={(tracks || []).map((t) => ({ id: t.id, title: t.title, artist: t.artist }))} />
        )}
        <VolumeOverlay visible={volumeVisible} volume={volume} />
      </main>
      </div>
    </div>
  )
}


