import React from 'react'

export function SongList(props: { mode: 'grid' | 'list' }) {
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


