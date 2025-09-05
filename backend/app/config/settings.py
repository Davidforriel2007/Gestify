from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

# Load variables from .env if present
load_dotenv()


class Settings(BaseSettings):
    cors_origins: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Spotify OAuth
    spotify_client_id: str = os.getenv("SPOTIFY_CLIENT_ID", "")
    spotify_client_secret: str = os.getenv("SPOTIFY_CLIENT_SECRET", "")
    spotify_redirect_uri: str = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8000/callback")
    spotify_scope: str = os.getenv(
        "SPOTIFY_SCOPE",
        "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state playlist-read-private playlist-read-collaborative",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


