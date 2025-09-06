import React from 'react'

function msToTime(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60).toString()
  const s = (total % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export function SongList(props: { mode: 'grid' | 'list'; tracks?: { id: string; title: string; artist: string; duration_ms?: number }[] }) {
  const { mode, tracks } = props
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
  const rows = Array.isArray(tracks) && tracks.length > 0
    ? tracks
    : Array.from({ length: 15 }).map((_, i) => ({ id: String(i), title: `Sample Track ${i + 1}`, artist: `Artist ${i + 1}`, duration_ms: 180000 }))
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
            {rows.map((t, i) => (
              <tr key={t.id ?? i} className="hover:bg-white/5">
                <td className="px-4 py-2 text-sm text-neutral-400">{i + 1}</td>
                <td className="px-4 py-2 text-sm truncate">{t.title}</td>
                <td className="px-4 py-2 text-sm text-neutral-400 truncate">{t.artist}</td>
                <td className="px-4 py-2 text-sm text-neutral-400">{msToTime(t.duration_ms ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


