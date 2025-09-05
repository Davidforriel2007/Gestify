from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from ..services.auth import get_authorize_url, exchange_code_for_token, token_store


router = APIRouter()


@router.get("/login")
async def login():
    url = get_authorize_url()
    return RedirectResponse(url)


@router.get("/callback")
async def callback(code: str | None = None, error: str | None = None):
    if error:
        raise HTTPException(status_code=400, detail=error)
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    tokens = await exchange_code_for_token(code)
    # For simplicity, redirect back to frontend with access_token in URL hash
    # In production, use HTTP-only cookies and a real session mechanism
    access_token = tokens.get("access_token", "")
    return RedirectResponse(url=f"http://localhost:5173/#access_token={access_token}")


@router.get("/auth/token_status")
async def token_status():
    t = token_store.get("default")
    if not t:
        return {"has_token": False}
    return {
        "has_token": True,
        "expires_at": t.get("expires_at"),
        "scope": t.get("scope"),
        "has_refresh_token": bool(t.get("refresh_token")),
    }


