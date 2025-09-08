from typing import Any, Dict, Optional
import logging
import httpx
from ..services.auth import get_valid_access_token, refresh_access_token


SPOTIFY_API = "https://api.spotify.com/v1"
# Use uvicorn's error logger so messages appear in the default console output
logger = logging.getLogger("uvicorn.error")


def _log_search_result(query: str, label: str, data: Dict[str, Any]) -> None:
    try:
        tracks = (data or {}).get("tracks", {}).get("items", []) or []
        playlists = (data or {}).get("playlists", {}).get("items", []) or []
        albums = (data or {}).get("albums", {}).get("items", []) or []
        artists = (data or {}).get("artists", {}).get("items", []) or []
        track_titles = [str(t.get("name")) for t in tracks[:3] if isinstance(t, dict)]
        playlist_names = [str(p.get("name")) for p in playlists[:3] if isinstance(p, dict)]
        album_names = [str(a.get("name")) for a in albums[:3] if isinstance(a, dict)]
        artist_names = [str(a.get("name")) for a in artists[:3] if isinstance(a, dict)]
        logger.info(
            "[Spotify search] %s q=%r tracks=%d %s playlists=%d %s albums=%d %s artists=%d %s",
            label,
            query,
            len(tracks) if isinstance(tracks, list) else 0,
            track_titles,
            len(playlists) if isinstance(playlists, list) else 0,
            playlist_names,
            len(albums) if isinstance(albums, list) else 0,
            album_names,
            len(artists) if isinstance(artists, list) else 0,
            artist_names,
        )
    except Exception as e:
        logger.warning("[Spotify search] logging failed: %s", e)


async def _authorized_client(token_override: Optional[str] = None) -> httpx.AsyncClient:
    if token_override:
        # token_override may already include 'Bearer '
        if token_override.lower().startswith("bearer "):
            auth_header = token_override
        else:
            auth_header = f"Bearer {token_override}"
        return httpx.AsyncClient(headers={"Authorization": auth_header})

    token = get_valid_access_token()
    if not token:
        # Try refreshing, then re-check
        await refresh_access_token()
        token = get_valid_access_token()
        if not token:
            raise RuntimeError("Not authenticated with Spotify")
    headers = {"Authorization": f"Bearer {token}"}
    return httpx.AsyncClient(headers=headers)


async def get_me_playlists(limit: int = 20, token_override: Optional[str] = None) -> Dict[str, Any]:
    async with await _authorized_client(token_override) as client:
        resp = await client.get(f"{SPOTIFY_API}/me/playlists", params={"limit": limit})
        if resp.status_code == 401:
            await refresh_access_token()
            async with await _authorized_client(token_override) as client2:
                resp = await client2.get(f"{SPOTIFY_API}/me/playlists", params={"limit": limit})
        resp.raise_for_status()
        return resp.json()


async def get_playlist_tracks(playlist_id: str, limit: int = 100, token_override: Optional[str] = None) -> Dict[str, Any]:
    async with await _authorized_client(token_override) as client:
        resp = await client.get(f"{SPOTIFY_API}/playlists/{playlist_id}/tracks", params={"limit": limit})
        if resp.status_code == 401:
            await refresh_access_token()
            async with await _authorized_client(token_override) as client2:
                resp = await client2.get(f"{SPOTIFY_API}/playlists/{playlist_id}/tracks", params={"limit": limit})
        resp.raise_for_status()
        return resp.json()


async def search_global(query: str, limit: int = 10, token_override: Optional[str] = None) -> Dict[str, Any]:
    async with await _authorized_client(token_override) as client:
        resp = await client.get(
            f"{SPOTIFY_API}/search",
            params={"q": query, "type": "track,playlist,album,artist", "limit": limit, "market": "from_token"},
        )
        if resp.status_code == 401:
            await refresh_access_token()
            async with await _authorized_client(token_override) as client2:
                resp = await client2.get(
                    f"{SPOTIFY_API}/search",
                    params={"q": query, "type": "track,playlist,album,artist", "limit": limit, "market": "from_token"},
                )
        resp.raise_for_status()
        data = resp.json()
        _log_search_result(query, "primary market=from_token", data)
        # Fallback: if no items returned, retry without market and include external audio
        try:
            tracks_empty = not (data.get("tracks", {}).get("items"))
            playlists_empty = not (data.get("playlists", {}).get("items"))
            albums_empty = not (data.get("albums", {}).get("items"))
            artists_empty = not (data.get("artists", {}).get("items"))
        except Exception:
            tracks_empty = playlists_empty = albums_empty = artists_empty = False
        if tracks_empty and playlists_empty and albums_empty and artists_empty:
            resp2 = await client.get(
                f"{SPOTIFY_API}/search",
                params={"q": query, "type": "track,playlist,album,artist", "limit": limit, "include_external": "audio"},
            )
            # best-effort: if unauthorized, refresh and retry once
            if resp2.status_code == 401:
                await refresh_access_token()
                async with await _authorized_client(token_override) as client3:
                    resp2 = await client3.get(
                        f"{SPOTIFY_API}/search",
                        params={"q": query, "type": "track,playlist,album,artist", "limit": limit, "include_external": "audio"},
                    )
            resp2.raise_for_status()
            fallback_data = resp2.json()
            _log_search_result(query, "fallback include_external", fallback_data)
            return fallback_data
        return data


async def get_playlist_detail(playlist_id: str, token_override: Optional[str] = None) -> Dict[str, Any]:
    async with await _authorized_client(token_override) as client:
        resp = await client.get(f"{SPOTIFY_API}/playlists/{playlist_id}")
        if resp.status_code == 401:
            await refresh_access_token()
            async with await _authorized_client(token_override) as client2:
                resp = await client2.get(f"{SPOTIFY_API}/playlists/{playlist_id}")
        resp.raise_for_status()
        return resp.json()


