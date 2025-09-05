import React from 'react'

export function PlayerBar(props: {
  song: { title: string; artist: string; coverUrl: string } | null
  isPlaying: boolean
  onPlayPause: () => void
  onPrev: () => void
  onNext: () => void
  // right side actions/status
  isLoggedIn: boolean
  onLogin: () => void
  gesturesEnabled: boolean
  onToggleGestures: () => void
  statusText?: string
}) {
  const { song, isPlaying, onPlayPause, onPrev, onNext, isLoggedIn, onLogin, gesturesEnabled, onToggleGestures, statusText } = props
  return (
    <div className="fixed top-0 inset-x-0 z-20 w-full border-b border-white/5 bg-surface-200/60 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
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

        <div className="flex items-center gap-2">
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

        <div className="flex items-center gap-3 min-w-0">
          {isLoggedIn ? (
            <>
              <button
                className={'rounded-md px-3 py-1 text-xs ' + (gesturesEnabled ? 'bg-red-500/80 hover:bg-red-400' : 'bg-white/10 hover:bg-white/20')}
                onClick={onToggleGestures}
              >
                {gesturesEnabled ? 'Disable Gestures' : 'Enable Gestures'}
              </button>
              {statusText && (
                <span className="truncate text-xs text-neutral-400 max-w-[280px]">{statusText}</span>
              )}
            </>
          ) : (
            <button
              className="rounded-md bg-emerald-500/90 px-3 py-1 text-xs font-medium text-neutral-950 hover:bg-emerald-400"
              onClick={onLogin}
            >
              Login with Spotify
            </button>
          )}
        </div>
      </div>
    </div>
  )
}


