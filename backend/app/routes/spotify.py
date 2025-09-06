from fastapi import APIRouter, HTTPException, Query, Header
from ..services.spotify import get_me_playlists, get_playlist_tracks, search_global, get_playlist_detail


router = APIRouter(prefix="/api")


@router.get("/me/playlists")
async def me_playlists(authorization: str | None = Header(default=None)):
    try:
        return await get_me_playlists(token_override=authorization)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/playlists/{playlist_id}/tracks")
async def playlist_tracks(playlist_id: str, authorization: str | None = Header(default=None)):
    try:
        return await get_playlist_tracks(playlist_id, token_override=authorization)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/search")
async def search(q: str = Query("", min_length=1), limit: int = 10, authorization: str | None = Header(default=None)):
    try:
        return await search_global(q, limit=limit, token_override=authorization)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/playlists/{playlist_id}")
async def playlist_detail(playlist_id: str, authorization: str | None = Header(default=None)):
    try:
        return await get_playlist_detail(playlist_id, token_override=authorization)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


