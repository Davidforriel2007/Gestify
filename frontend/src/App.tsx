import React, { useEffect, useMemo, useState } from 'react'
import { useSpotifyPlayer } from './hooks/useSpotifyPlayer'

// Zone 1: Top Bar (Now Playing)
function TopBar(props: {
  song: { title: string; artist: string; coverUrl: string } | null
  isPlaying: boolean
  onPlayPause: () => void
  onPrev: () => void
  onNext: () => void
}) {
  const { song, isPlaying, onPlayPause, onPrev, onNext } = props
  return (
    <div className="fixed top-0 inset-x-0 z-20 w-full border-b border-white/5 bg-surface-200/60 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 overflow-hidden rounded-md bg-white/10">
            {song?.coverUrl ? (
              <img src={song.coverUrl} alt="cover" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">
              {song?.title ?? 'Nothing playing'}
            </div>
            <div className="truncate text-xs text-neutral-400">
              {song?.artist ?? '—'}
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={onPrev}
            className="rounded-md px-2 py-1 text-sm text-neutral-200 hover:bg-white/10"
            aria-label="Previous"
          >
            ◀◀
          </button>
          <button
            onClick={onPlayPause}
            className="rounded-md px-3 py-1 text-sm font-semibold text-neutral-900 bg-neutral-100 hover:bg-white"
            aria-label="Play/Pause"
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onNext}
            className="rounded-md px-2 py-1 text-sm text-neutral-200 hover:bg-white/10"
            aria-label="Next"
          >
            ▶▶
          </button>
        </div>
      </div>
    </div>
  )
}

// Zone 3: Sidebar
function Sidebar(props: {
  collapsed: boolean
  onToggleCollapse: () => void
}) {
  const { collapsed, onToggleCollapse } = props
  return (
    <aside
      className={
        'fixed left-0 top-16 bottom-0 flex flex-col border-r border-white/5 bg-surface-300/60 backdrop-blur transition-all duration-300 ' +
        (collapsed ? 'w-16' : 'w-64')
      }
    >
      <div className="flex items-center gap-2 p-3">
        <button
          className="rounded-md bg-white/10 px-2 py-1 text-xs text-neutral-200 hover:bg-white/20"
          onClick={onToggleCollapse}
        >
          {collapsed ? '›' : '‹'}
        </button>
        {!collapsed && <span className="text-sm font-medium">Navigation</span>}
      </div>
      <div className="p-3">
        <input
          placeholder="Search"
          className={
            'w-full rounded-md bg-white/10 px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 ' +
            (collapsed ? 'hidden' : '')
          }
        />
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-2">
        <a
          className={'flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/10 transition-[padding] ' + (collapsed ? 'justify-center' : '')}
          href="#"
        >
          <span className="inline-block h-5 w-5 rounded bg-white/20" aria-hidden="true" />
          {!collapsed && <span>Home</span>}
        </a>
        <a
          className={'flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-white/10 transition-[padding] ' + (collapsed ? 'justify-center' : '')}
          href="#"
        >
          <span className="inline-block h-5 w-5 rounded bg-white/20" aria-hidden="true" />
          {!collapsed && <span>Playlists</span>}
        </a>
      </nav>
      <div className="border-t border-white/5 p-3">
        <div className={collapsed ? 'hidden' : 'flex items-center gap-2'}>
          <div className="h-8 w-8 rounded-full bg-white/10" />
          <div className="min-w-0">
            <div className="truncate text-sm">User Name</div>
            <button className="text-xs text-neutral-400 hover:text-neutral-200">Logout</button>
          </div>
        </div>
        {collapsed && (
          <div className="text-center text-xs text-neutral-400">U</div>
        )}
      </div>
    </aside>
  )
}

// Zone 2: Main Content
function MainContent(props: {
  mode: 'grid' | 'list'
}) {
  const { mode } = props
  if (mode === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white/5 p-3 hover:bg-white/10">
            <div className="aspect-square w-full rounded-md bg-white/10" />
            <div className="mt-2 text-sm font-medium truncate">Category {i + 1}</div>
            <div className="text-xs text-neutral-400 truncate">Subtitle</div>
          </div>
        ))}
      </div>
    )
  }
  // list mode
  return (
    <div className="p-4">
      <div className="overflow-hidden rounded-lg border border-white/5">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">#</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Title</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Artist</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-neutral-400">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Array.from({ length: 15 }).map((_, i) => (
              <tr key={i} className="hover:bg-white/5">
                <td className="px-4 py-2 text-sm text-neutral-400">{i + 1}</td>
                <td className="px-4 py-2 text-sm">Sample Track {i + 1}</td>
                <td className="px-4 py-2 text-sm text-neutral-400">Artist {i + 1}</td>
                <td className="px-4 py-2 text-sm text-neutral-400">3:{(i % 6) * 10}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Floating Volume Overlay (center-right) with auto-hide
function VolumeOverlay(props: { visible: boolean; volume: number }) {
  const { visible, volume } = props
  return (
    <div
      className={
        'pointer-events-none fixed right-6 top-1/2 z-30 -translate-y-1/2 transform transition-opacity duration-300 ' +
        (visible ? 'opacity-100' : 'opacity-0')
      }
      aria-hidden={!visible}
    >
      <div className="flex h-56 w-14 items-end justify-center rounded-2xl border border-white/10 bg-surface-300/80 p-3 shadow-2xl backdrop-blur">
        <div className="relative h-full w-3 rounded bg-white/10">
          <div
            className="absolute bottom-0 w-full rounded bg-neutral-100 transition-all duration-300"
            style={{ height: `${Math.max(0, Math.min(100, volume))}%` }}
          />
        </div>
      </div>
      <div className="mt-2 w-full text-center text-xs text-neutral-300">{Math.round(volume)}%</div>
    </div>
  )
}

export function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mode, setMode] = useState<'grid' | 'list'>('grid')
  const [volume, setVolume] = useState(35)
  const [volumeVisible, setVolumeVisible] = useState(false)

  const mockToken = import.meta.env.VITE_SPOTIFY_TOKEN as string | undefined
  const { status, isLoggedIn, login, controls } = useSpotifyPlayer({
    getToken: async () => {
      // TODO: replace with exchanging code from backend or reading from storage
      if (mockToken) return mockToken
      // Fallback: return empty (will error in hook)
      return ''
    },
  })

  // mock current song
  const song = useMemo(
    () => ({
      title: 'Mock Song',
      artist: 'Mock Artist',
      coverUrl: 'https://picsum.photos/seed/music/200/200',
    }),
    []
  )

  // Auto-hide volume overlay after 2.5s
  useEffect(() => {
    if (!volumeVisible) return
    const id = setTimeout(() => setVolumeVisible(false), 2500)
    return () => clearTimeout(id)
  }, [volumeVisible])

  // Volume overlay is controlled externally (e.g., gestures). No manual buttons here.

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-neutral-100">
      <TopBar
        song={song}
        isPlaying={isPlaying}
        onPlayPause={async () => {
          setIsPlaying((p) => !p)
          await controls.togglePlay?.()
        }}
        onPrev={async () => {
          await controls.previous?.()
        }}
        onNext={async () => {
          await controls.next?.()
        }}
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
              {!isLoggedIn && (
                <button
                  className="rounded-md bg-emerald-500/90 px-3 py-1 text-xs font-medium text-neutral-950 hover:bg-emerald-400"
                  onClick={() => {
                    // Redirect to backend /login if available; for now, use mock login
                    login()
                  }}
                >
                  Login with Spotify
                </button>
              )}
              {isLoggedIn && (
                <span className="text-xs text-neutral-400">
                  {status.kind === 'ready' && `Player ready on device ${status.deviceId}`}
                  {status.kind === 'loading' && 'Initializing player...'}
                  {status.kind === 'not_ready' && 'Player not ready'}
                  {status.kind === 'error' && `Player error: ${status.message}`}
                </span>
              )}
            </div>
        </div>
        <MainContent mode={mode} />
        <VolumeOverlay visible={volumeVisible} volume={volume} />
      </main>
    </div>
  )
}


