from fastapi import APIRouter, HTTPException
from ..services.spotify import get_me_playlists, get_playlist_tracks


router = APIRouter(prefix="/api")


@router.get("/me/playlists")
async def me_playlists():
    try:
        return await get_me_playlists()
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/playlists/{playlist_id}/tracks")
async def playlist_tracks(playlist_id: str):
    try:
        return await get_playlist_tracks(playlist_id)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


