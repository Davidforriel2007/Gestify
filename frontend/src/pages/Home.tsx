import React, { useEffect, useMemo, useState } from 'react'
import { PlayerBar } from '../components/PlayerBar/PlayerBar'
import { Sidebar } from '../components/Sidebar/Sidebar'
import { SongList } from '../components/SongList/SongList'
import { VolumeOverlay } from '../components/VolumeOverlay/VolumeOverlay'
import { useSpotifyPlayerContext } from '../context/SpotifyPlayerContext'
import { useWebSocket } from '../hooks/useWebSocket'

export function Home() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
  const [volume, setVolume] = useState(35)
  const [volumeVisible, setVolumeVisible] = useState(false)
  const [gesturesEnabled, setGesturesEnabled] = useState(false)

  const { status, isLoggedIn, login, controls } = useSpotifyPlayerContext()

  const song = useMemo(
    () => ({
      title: 'Mock Song',
      artist: 'Mock Artist',
      coverUrl: 'https://picsum.photos/seed/music/200/200',
    }),
    []
  )

  useEffect(() => {
    if (!volumeVisible) return
    const id = setTimeout(() => setVolumeVisible(false), 2500)
    return () => clearTimeout(id)
  }, [volumeVisible])

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <PlayerBar
        song={song}
        isPlaying={isPlaying}
        onPlayPause={async () => {
          setIsPlaying((p) => !p)
          await controls.togglePlay?.()
        }}
        onPrev={async () => { await controls.previous?.() }}
        onNext={async () => { await controls.next?.() }}
        isLoggedIn={isLoggedIn}
        onLogin={() => login()}
        gesturesEnabled={gesturesEnabled}
        onToggleGestures={() => setGesturesEnabled((e) => !e)}
        statusText={
          isLoggedIn
            ? (status.kind === 'ready' && `Player ready on device ${status.deviceId}`) ||
              (status.kind === 'loading' && 'Initializing player...') ||
              (status.kind === 'not_ready' && 'Player not ready') ||
              (status.kind === 'error' && `Player error: ${status.message}`) || ''
            : ''
        }
      />

      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
      />

      <main
        className={
          'relative h-full overflow-y-auto pt-16 ' +
          (sidebarCollapsed ? 'ml-16' : 'ml-64')
        }
      >
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
        <SongList mode={mode} />
        <VolumeOverlay visible={volumeVisible} volume={volume} />
      </main>
    </div>
  )
}


