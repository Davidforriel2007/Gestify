import time
from typing import Dict, Optional
import httpx
from ..config.settings import get_settings


settings = get_settings()


class TokenStore:
    """In-memory token store keyed by a simple user key.
    For now we only track ONE user/session. Replace with DB later.
    """

    def __init__(self) -> None:
        self._tokens: Dict[str, Dict] = {}

    def get(self, user_key: str = "default") -> Optional[Dict]:
        return self._tokens.get(user_key)

    def set(self, data: Dict, user_key: str = "default") -> None:
        self._tokens[user_key] = data


token_store = TokenStore()


SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize"
SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token"


def get_authorize_url(state: str = "state") -> str:
    params = {
        "response_type": "code",
        "client_id": settings.spotify_client_id,
        "scope": settings.spotify_scope,
        "redirect_uri": settings.spotify_redirect_uri,
        "state": state,
        "show_dialog": "false",
    }
    from urllib.parse import urlencode

    return f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"


async def exchange_code_for_token(code: str) -> Dict:
    async with httpx.AsyncClient() as client:
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.spotify_redirect_uri,
            "client_id": settings.spotify_client_id,
            "client_secret": settings.spotify_client_secret,
        }
        resp = await client.post(SPOTIFY_TOKEN_URL, data=data)
        resp.raise_for_status()
        payload = resp.json()
        payload["expires_at"] = int(time.time()) + int(payload.get("expires_in", 3600))
        token_store.set(payload)
        return payload


async def refresh_access_token(user_key: str = "default") -> Dict:
    tokens = token_store.get(user_key)
    if not tokens or "refresh_token" not in tokens:
        raise RuntimeError("No refresh token available")
    refresh_token = tokens["refresh_token"]
    async with httpx.AsyncClient() as client:
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": settings.spotify_client_id,
            "client_secret": settings.spotify_client_secret,
        }
        resp = await client.post(SPOTIFY_TOKEN_URL, data=data)
        resp.raise_for_status()
        refreshed = resp.json()
        # Keep original refresh_token if not provided back
        if "refresh_token" not in refreshed:
            refreshed["refresh_token"] = refresh_token
        refreshed["expires_at"] = int(time.time()) + int(refreshed.get("expires_in", 3600))
        token_store.set(refreshed, user_key)
        return refreshed


def get_valid_access_token(user_key: str = "default") -> Optional[str]:
    tokens = token_store.get(user_key)
    if not tokens:
        return None
    if tokens.get("expires_at", 0) - 60 <= int(time.time()):
        # caller should call refresh when needed; keep simple helper
        return None
    return tokens.get("access_token")


