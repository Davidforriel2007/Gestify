import React from 'react'

export function VolumeOverlay(props: { visible: boolean; volume: number }) {
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


