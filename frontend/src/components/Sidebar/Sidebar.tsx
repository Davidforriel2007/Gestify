import React from 'react'

export function Sidebar(props: { collapsed: boolean; onToggleCollapse: () => void }) {
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


