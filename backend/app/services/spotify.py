from typing import Any, Dict
import httpx
from ..services.auth import get_valid_access_token, refresh_access_token


SPOTIFY_API = "https://api.spotify.com/v1"


async def _authorized_client() -> httpx.AsyncClient:
    token = get_valid_access_token()
    if not token:
        # Try refreshing, then re-check
        await refresh_access_token()
        token = get_valid_access_token()
        if not token:
            raise RuntimeError("Not authenticated with Spotify")
    headers = {"Authorization": f"Bearer {token}"}
    return httpx.AsyncClient(headers=headers)


async def get_me_playlists(limit: int = 20) -> Dict[str, Any]:
    async with await _authorized_client() as client:
        resp = await client.get(f"{SPOTIFY_API}/me/playlists", params={"limit": limit})
        if resp.status_code == 401:
            await refresh_access_token()
            async with await _authorized_client() as client2:
                resp = await client2.get(f"{SPOTIFY_API}/me/playlists", params={"limit": limit})
        resp.raise_for_status()
        return resp.json()


async def get_playlist_tracks(playlist_id: str, limit: int = 100) -> Dict[str, Any]:
    async with await _authorized_client() as client:
        resp = await client.get(f"{SPOTIFY_API}/playlists/{playlist_id}/tracks", params={"limit": limit})
        if resp.status_code == 401:
            await refresh_access_token()
            async with await _authorized_client() as client2:
                resp = await client2.get(f"{SPOTIFY_API}/playlists/{playlist_id}/tracks", params={"limit": limit})
        resp.raise_for_status()
        return resp.json()


