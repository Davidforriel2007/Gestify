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
  const res = await fetch(`${BACKEND}/api/me/playlists`)
  if (!res.ok) throw new Error(`Failed to load playlists: ${res.status}`)
  const json = await res.json()
  const items = Array.isArray(json.items) ? json.items : []
  return items.map((p: any) => ({ id: p.id, name: p.name, images: p.images, tracksTotal: p.tracks?.total }))
}

export async function fetchPlaylistTracks(playlistId: string): Promise<Track[]> {
  const res = await fetch(`${BACKEND}/api/playlists/${playlistId}/tracks`)
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
  artists?: { id: string; name: string; imageUrl?: string }[]
  albums?: { id: string; name: string; artist: string; coverUrl?: string }[]
}

// Authorization headers are no longer sent from the frontend.
// The backend maintains and refreshes tokens server-side.

export async function searchAll(query: string): Promise<SearchResults> {
  try { console.log('[searchAll] fetching', query) } catch {}
  const res = await fetch(`${BACKEND}/api/search?q=${encodeURIComponent(query)}`)
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
  const artistItems = Array.isArray(json?.artists?.items)
    ? json.artists.items
    : (Array.isArray(json?.artists) ? json.artists : [])
  const result: SearchResults = {
    tracks: tracksItems
      .filter((t: any) => t && (t.id || t.uri))
      .map((t: any) => ({
        id: t.id ?? t.uri,
        title: t.name ?? '',
        artist: Array.isArray(t?.artists) ? t.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : '',
        uri: t.uri ?? '',
        albumArt: (Array.isArray(t?.album?.images) && t.album.images.length > 0)
          ? (t.album.images[0]?.url || t.album.images[1]?.url || t.album.images[2]?.url)
          : undefined,
      })),
    playlists: playlistsItems
      .filter((p: any) => p && p.id)
      .map((p: any) => ({
        id: p.id,
        name: p.name ?? '',
        cover: p?.images?.[1]?.url || p?.images?.[0]?.url,
        tracksTotal: p?.tracks?.total,
      })),
    artists: artistItems
      .filter((a: any) => a && (a.id || a.name))
      .map((a: any) => ({
        id: a.id ?? a.name,
        name: a.name ?? '',
        imageUrl: (Array.isArray(a?.images) && a.images.length > 0) ? (a.images[0]?.url || a.images[1]?.url) : undefined,
      })),
    albums: (Array.isArray(json?.albums?.items) ? json.albums.items : (Array.isArray(json?.albums) ? json.albums : []))
      .filter((al: any) => al && (al.id || al.name))
      .map((al: any) => ({
        id: al.id ?? al.name,
        name: al.name ?? '',
        artist: Array.isArray(al?.artists) ? al.artists.map((a: any) => a?.name).filter(Boolean).join(', ') : '',
        coverUrl: (Array.isArray(al?.images) && al.images.length > 0) ? (al.images[0]?.url || al.images[1]?.url) : undefined,
      })),
  }
  try { console.log('[searchAll] parsed', query, result.tracks.length, result.playlists.length) } catch {}
  return result
}

export async function fetchPlaylistDetail(playlistId: string): Promise<Playlist> {
  const res = await fetch(`${BACKEND}/api/playlists/${playlistId}`)
  if (!res.ok) throw new Error(`Failed to load playlist: ${res.status}`)
  const p = await res.json()
  return { id: p.id, name: p.name, images: p.images, tracksTotal: p.tracks?.total }
}


