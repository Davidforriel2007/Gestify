import React from 'react'
import type { Playlist } from '../../hooks/useSpotifyApi'

export function Sidebar(props: {
  collapsed: boolean
  onToggleCollapse: () => void
  playlists?: Playlist[]
  selectedPlaylistId?: string | null
  onSelectPlaylist?: (id: string) => void
  search: string
  onSearchChange: (v: string) => void
}) {
  const { collapsed, onToggleCollapse, playlists = [], selectedPlaylistId, onSelectPlaylist, search, onSearchChange } = props
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
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className={
            'w-full rounded-md bg-white/10 px-3 py-2 text-sm placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-white/20 ' +
            (collapsed ? 'hidden' : '')
          }
        />
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-2 overflow-y-auto">
        {!collapsed && <div className="px-3 py-1 text-xs uppercase tracking-wider text-neutral-400">Playlists</div>}
        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelectPlaylist?.(p.id)}
            className={
              'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-white/10 transition-[padding] ' +
              (collapsed ? 'justify-center' : '') +
              (selectedPlaylistId === p.id ? ' bg-white/10' : '')
            }
            title={p.name}
          >
            <span className="inline-block h-5 w-5 rounded bg-white/20" aria-hidden="true" />
            {!collapsed && <span className="truncate">{p.name}</span>}
          </button>
        ))}
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


