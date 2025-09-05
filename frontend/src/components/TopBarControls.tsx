import React from 'react'
import { useSpotifyPlayerContext } from '../context/SpotifyPlayerContext'

export function TopBarControls(props: { onVolumeChange?: (v: number) => void }) {
  const { controls } = useSpotifyPlayerContext()
  const { onVolumeChange } = props

  return (
    <div className="ml-auto flex items-center gap-2">
      <button
        onClick={() => controls.previous()}
        className="rounded-md px-2 py-1 text-sm text-neutral-200 hover:bg-white/10"
        aria-label="Previous"
      >
        ◀◀
      </button>
      <button
        onClick={() => controls.togglePlay()}
        className="rounded-md px-3 py-1 text-sm font-semibold text-neutral-900 bg-neutral-100 hover:bg-white"
        aria-label="Play/Pause"
      >
        Play/Pause
      </button>
      <button
        onClick={() => controls.next()}
        className="rounded-md px-2 py-1 text-sm text-neutral-200 hover:bg-white/10"
        aria-label="Next"
      >
        ▶▶
      </button>
      <input
        type="range"
        min={0}
        max={100}
        defaultValue={50}
        onChange={(e) => {
          const v = Number(e.target.value)
          controls.setVolume(v / 100)
          onVolumeChange?.(v)
        }}
      />
    </div>
  )
}


