const BACKEND = 'http://localhost:8000'

export type Playlist = {
  id: string
  name: string
  images?: { url: string }[]
  tracksTotal?: number
}

export type Track = {
  id: string
  title: string
  artist: string
  duration_ms: number
}

export async function fetchPlaylists(): Promise<Playlist[]> {
  const res = await fetch(`${BACKEND}/api/me/playlists`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed to load playlists: ${res.status}`)
  const json = await res.json()
  const items = Array.isArray(json.items) ? json.items : []
  return items.map((p: any) => ({ id: p.id, name: p.name, images: p.images, tracksTotal: p.tracks?.total }))
}

export async function fetchPlaylistTracks(playlistId: string): Promise<Track[]> {
  const res = await fetch(`${BACKEND}/api/playlists/${playlistId}/tracks`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed to load tracks: ${res.status}`)
  const json = await res.json()
  const items = Array.isArray(json.items) ? json.items : []
  return items
    .map((it: any) => it?.track)
    .filter(Boolean)
    .map((t: any) => ({
      id: t.id,
      title: t.name,
      artist: (t.artists || []).map((a: any) => a.name).join(', '),
      duration_ms: t.duration_ms ?? 0,
    }))
}

export type SearchResults = {
  tracks: { id: string; title: string; artist: string; uri: string; albumArt?: string }[]
  playlists: { id: string; name: string; cover?: string; tracksTotal?: number }[]
}

function authHeaders() {
  const t = localStorage.getItem('spotify_access_token')
  return t ? { Authorization: 'Bearer ' + t } : {}
}

export async function searchAll(query: string): Promise<SearchResults> {
  try { console.log('[searchAll] fetching', query) } catch {}
  const res = await fetch(`${BACKEND}/api/search?q=${encodeURIComponent(query)}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  const json = await res.json()
  // Support both raw Spotify shape (tracks.items/playlists.items)
  // and a potential simplified backend shape (tracks[]/playlists[])
  const tracksItems = Array.isArray(json?.tracks?.items)
    ? json.tracks.items
    : (Array.isArray(json?.tracks) ? json.tracks : [])
  const playlistsItems = Array.isArray(json?.playlists?.items)
    ? json.playlists.items
    : (Array.isArray(json?.playlists) ? json.playlists : [])
  const result: SearchResults = {
    tracks: tracksItems
      .filter((t: any) => t && (t.id || t.uri))
      .map((t: any) => ({
        id: t.id ?? t.uri,
        title: t.name ?? '',
        artist: Array.isArray(t?.artists) ? t.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : '',
        uri: t.uri ?? '',
        albumArt: t?.album?.images?.[2]?.url || t?.album?.images?.[1]?.url || t?.album?.images?.[0]?.url,
      })),
    playlists: playlistsItems
      .filter((p: any) => p && p.id)
      .map((p: any) => ({
        id: p.id,
        name: p.name ?? '',
        cover: p?.images?.[1]?.url || p?.images?.[0]?.url,
        tracksTotal: p?.tracks?.total,
      })),
  }
  try { console.log('[searchAll] parsed', query, result.tracks.length, result.playlists.length) } catch {}
  return result
}

export async function fetchPlaylistDetail(playlistId: string): Promise<Playlist> {
  const res = await fetch(`${BACKEND}/api/playlists/${playlistId}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Failed to load playlist: ${res.status}`)
  const p = await res.json()
  return { id: p.id, name: p.name, images: p.images, tracksTotal: p.tracks?.total }
}


