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
  progressMs?: number
  durationMs?: number
  onSeek?: (ms: number) => void
}) {
  const { song, isPlaying, onPlayPause, onPrev, onNext, isLoggedIn, onLogin, gesturesEnabled, onToggleGestures, statusText, progressMs = 0, durationMs = 0, onSeek } = props
  const pct = durationMs > 0 ? Math.min(100, Math.max(0, (progressMs / durationMs) * 100)) : 0

  function handleProgressClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!durationMs) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const newMs = Math.round(durationMs * ratio)
    onSeek?.(newMs)
  }
  return (
    <div className="sticky top-0 z-20 w-full border-b border-white/5 bg-surface-200/60 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Left: Playback controls */}
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center p-1 text-white active:text-neutral-400"
            aria-label="Previous"
            title="Previous"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 6l-6 6 6 6"/>
              <path d="M19 6l-6 6 6 6"/>
            </svg>
          </button>
          <button
            onClick={onPlayPause}
            className="flex h-10 w-10 items-center justify-center p-1 text-white active:text-neutral-400"
            aria-label="Play/Pause"
            title="Play/Pause"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <rect x="7" y="5" width="4" height="14" rx="1"/>
                <rect x="13" y="5" width="4" height="14" rx="1"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7-11-7z"/>
              </svg>
            )}
          </button>
          <button
            onClick={onNext}
            className="flex h-8 w-8 items-center justify-center p-1 text-white active:text-neutral-400"
            aria-label="Next"
            title="Next"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 6l6 6-6 6"/>
              <path d="M5 6l6 6-6 6"/>
            </svg>
          </button>
        </div>

        {/* Center: Album art + song info + progress */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <div className="mx-auto flex w-full max-w-[90%] sm:max-w-[600px] items-end space-x-3">
            <div className="h-12 w-12 overflow-hidden rounded-md bg-white/10">
              {song?.coverUrl ? (
                <img src={song.coverUrl} alt="cover" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex h-12 flex-col justify-end items-center text-center">
              <div className="truncate text-sm font-semibold">
                {song?.title ?? 'Nothing playing'}
              </div>
              <div className="truncate text-xs text-neutral-400">
                {song?.artist ?? '—'}
              </div>
              {durationMs > 0 && (
                <div className="mt-1 h-1 w-full rounded bg-white/10" onClick={handleProgressClick} role="progressbar" aria-valuemin={0} aria-valuemax={durationMs} aria-valuenow={Math.min(progressMs, durationMs)}>
                  <div className="h-1 rounded bg-neutral-300" style={{ width: pct + '%' }} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Gestures/login */}
        <div className="flex items-center gap-3 min-w-0">
          {statusText && (
            <span className="hidden sm:block truncate text-xs text-neutral-400 max-w-[280px]">{statusText}</span>
          )}
          {isLoggedIn ? (
            <button
              onClick={onToggleGestures}
              aria-label={gesturesEnabled ? 'Disable gestures' : 'Enable gestures'}
              title={gesturesEnabled ? 'Disable gestures' : 'Enable gestures'}
              className="flex h-6 w-6 items-center justify-center text-white hover:text-neutral-400 transition"
            >
              {gesturesEnabled ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.6-1.36 1.53-2.6 2.64-3.64" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.84 2.84" />
                  <path d="M23 12c-.62 1.39-1.56 2.64-2.69 3.69" />
                  <path d="M1 1l22 22" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
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


