import React from 'react'

export type SongListSong = { id: string; title: string; artist: string; coverUrl?: string }
export type SongListArtist = { id: string; name: string; imageUrl?: string }

export function SongList(props: {
  songs?: SongListSong[]
  artists?: SongListArtist[]
  onPlaySong?: (id: string) => void
  albums?: { id: string; name: string; artist: string; coverUrl?: string }[]
}) {
  const songs = Array.isArray(props.songs) ? props.songs : []
  const artists = Array.isArray(props.artists) ? props.artists : []
  const handlePlay = (id: string) => props.onPlaySong?.(id)

  // Take only the first 6 songs and chunk into 3 columns of 2 rows each
  const topSix: SongListSong[] = (songs || []).slice(0, 6)
  const columns: SongListSong[][] = [0, 1, 2].map((col) => topSix.filter((_, i) => i % 3 === col))

  return (
    <div className="px-4 pb-6">
      {/* Top Results */}
      <div className="mb-3 text-sm font-semibold text-white">Top Results</div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {columns.map((col, idx) => (
          <div key={idx} className="flex flex-col gap-3">
            {col.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center gap-3 rounded-lg bg-surface-200/40 hover:bg-white/10 transition p-2 text-left"
                onClick={() => handlePlay(s.id)}
              >
                <div className="aspect-square w-16 overflow-hidden rounded-md bg-white/10 flex-shrink-0">
                  {s.coverUrl && <img src={s.coverUrl} alt="cover" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="truncate text-xs text-neutral-400">{s.artist}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
        {topSix.length === 0 && (
          <div className="text-sm text-neutral-400">No top results</div>
        )}
      </div>

      {/* Artists */}
      <div className="mt-8 mb-3 text-sm font-semibold text-white">Artists</div>
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hidden">
        {artists.map((a) => (
          <div key={a.id} className="w-24 flex-shrink-0">
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-white/10">
              {a.imageUrl ? (
                <img src={a.imageUrl} alt={a.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/10 text-neutral-400 text-sm font-medium">
                  {(a.name || '?').slice(0, 1)}
                </div>
              )}
            </div>
            <div className="mt-2 truncate text-center text-xs text-neutral-300">{a.name}</div>
          </div>
        ))}
        {artists.length === 0 && (
          <div className="text-sm text-neutral-400">No artists</div>
        )}
      </div>

      {/* Albums */}
      <div className="mt-8 mb-3 text-sm font-semibold text-white">Albums</div>
      <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hidden">
        {(props as any).albums?.map((al: { id: string; name: string; artist: string; coverUrl?: string }) => (
          <button
            key={al.id}
            className="w-40 flex-shrink-0 rounded-xl bg-surface-200/40 p-3 transition-all hover:scale-[1.02] hover:shadow-lg hover:bg-white/10 text-left"
          >
            <div className="aspect-square w-full overflow-hidden rounded-xl shadow">
              {al.coverUrl && (
                <img
                  src={al.coverUrl}
                  alt={al.name}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="mt-2 truncate text-sm font-medium">{al.name}</div>
            <div className="truncate text-xs text-neutral-400">{al.artist}</div>
          </button>
        ))}
      </div>

      {/* Songs */}
      <div className="mt-8 mb-3 text-sm font-semibold text-white">Songs</div>
      {songs.length > 0 ? (
        <div className="overflow-x-auto scroll-smooth snap-x snap-mandatory">
          <div className="grid grid-rows-3 grid-flow-col auto-cols-fr gap-4">
            {songs.map((s) => (
              <button
                key={s.id}
                className="w-full flex items-center gap-3 rounded-lg bg-surface-200/40 hover:bg-white/10 transition p-2 text-left flex-shrink-0 snap-start"
                onClick={() => handlePlay(s.id)}
              >
                <div className="aspect-square w-16 overflow-hidden rounded-md bg-white/10 flex-shrink-0">
                  {s.coverUrl && <img src={s.coverUrl} alt={s.title} className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.title}</div>
                  <div className="truncate text-xs text-neutral-400">{s.artist}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-neutral-400">No songs</div>
      )}
    </div>
  )
}


