import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PlayerBar } from '../components/PlayerBar/PlayerBar'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { SongList } from '../components/SongList/SongList'
import { VolumeOverlay } from '../components/VolumeOverlay/VolumeOverlay'
import { useSpotifyPlayerContext } from '../context/SpotifyPlayerContext'
import { useWebSocket } from '../hooks/useWebSocket'
import { searchAll, fetchPlaylistDetail, fetchPlaylists, type Playlist, type Track } from '../hooks/useSpotifyApi'

export function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
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
  const [searchResults, setSearchResults] = useState<{ tracks: { id: string; title: string; artist: string; uri: string; albumArt?: string }[]; playlists: { id: string; name: string; cover?: string; tracksTotal?: number }[] } | null>(null)
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
            setMode('list')
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
      setMode('grid')
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
          <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm text-neutral-300">{mode === 'grid' ? 'Browse' : 'Playlist'}</div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded-md bg-white/10 px-3 py-1 text-xs hover:bg-white/20"
                  onClick={() => setMode((m) => (m === 'grid' ? 'list' : 'grid'))}
                >
                  Toggle View
                </button>
              </div>
          </div>
          {searchResults ? (
            <div className="px-4 pb-6">
              <div className="mb-4 text-xs uppercase tracking-wider text-neutral-400">Tracks</div>
              {searchLoading && (
                <div className="mb-3 text-xs text-neutral-400">Searching…</div>
              )}
              {!searchLoading && Array.isArray(searchResults.tracks) && searchResults.tracks.length === 0 && (
                <div className="mb-6 text-sm text-neutral-400">No tracks found for "{search.trim()}"</div>
              )}
              <div className="overflow-hidden rounded-lg border border-white/5">
                <table className="min-w-full divide-y divide-white/5" role="table">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">#</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Title</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Artist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {searchResults.tracks.map((t, i) => (
                      <tr key={t.id} className="hover:bg-white/5 cursor-pointer" onClick={() => controls.playUri?.(t.uri)}>
                        <td className="px-4 py-2 text-sm text-neutral-400">{i + 1}</td>
                        <td className="px-4 py-2 text-sm flex items-center gap-3">
                          {t.albumArt && <img src={t.albumArt} alt="art" className="h-8 w-8 rounded object-cover" />}
                          <span className="truncate">{t.title}</span>
                        </td>
                        <td className="px-4 py-2 text-sm text-neutral-400 truncate">{t.artist}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-8 mb-4 text-xs uppercase tracking-wider text-neutral-400">Playlists</div>
              {!searchLoading && Array.isArray(searchResults.playlists) && searchResults.playlists.length === 0 && (
                <div className="mb-2 text-sm text-neutral-400">No playlists found</div>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {searchResults.playlists.map((p) => (
                  <button
                    key={p.id}
                    className="rounded-lg bg-white/5 p-3 text-left hover:bg-white/10"
                    onClick={async () => {
                      try {
                        const detail = await fetchPlaylistDetail(p.id)
                        setSelectedPlaylistId(detail.id)
                        setMode('list')
                        setSearchResults(null)
                      } catch {}
                    }}
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-md bg-white/10">
                      {p.cover && <img src={p.cover} alt="cover" className="h-full w-full object-cover" />}
                    </div>
                    <div className="mt-2 truncate text-sm font-medium">{p.name}</div>
                    <div className="text-xs text-neutral-400">{p.tracksTotal ?? 0} tracks</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <SongList mode={mode} tracks={tracks} />
          )}
          <VolumeOverlay visible={volumeVisible} volume={volume} />
        </main>
      </div>
    </div>
  )
}


