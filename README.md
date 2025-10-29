# Gestify

## Project Name & Pitch

Gestify — Gesture-controlled Spotify web player.

A web application that streams music via Spotify Web Playback SDK and lets you control playback with hand gestures (MediaPipe + OpenCV). Frontend (React + Tailwind) listens to a FastAPI backend over WebSocket for gesture events and maps them to Spotify actions (play/pause, next/previous, volume) using a shared JSON configuration.

## Project Status

This project is in active development.
- Gesture detection → WebSocket → Spotify control is implemented.
- OAuth login flow works for development.
- Sidebar, top bar, and playlist search UI are functional.
- Further improvements planned: environment overrides, persisted volume, backend “currently playing” fallback.

## Project Screen Shot(s)



## Installation and Setup Instructions

Clone this repository. You will need:
- Python 3.10–3.12.x (MediaPipe is not yet compatible with Python 3.13)
- Node.js 18+

### Backend (FastAPI)

1) Setup environment (PowerShell on Windows):

```powershell
cd backend

# Option A: set env vars (dev)
$env:SPOTIFY_CLIENT_ID = "your_client_id"
$env:SPOTIFY_CLIENT_SECRET = "your_client_secret"
$env:SPOTIFY_REDIRECT_URI = "http://localhost:8000/callback"

# Option B: create backend\.env with the same keys
```

2) Create/activate virtualenv with a supported Python (3.10–3.12.x) and install dependencies:

```powershell
# Ensure you're using a supported interpreter
# Example forcing Python 3.12 (adjust path/version as needed):
py -3.12 -m venv venv
./venv/Scripts/Activate.ps1

# Or for Python 3.10
# py -3.10 -m venv venv
# ./venv/Scripts/Activate.ps1

pip install -r backend/requirements.txt
```

> Note: MediaPipe currently does not support Python 3.13. If you have 3.13 installed, create the virtualenv with 3.12 or 3.10 as shown above.

3) Run the backend:

```powershell
cd backend
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Verify:
- Health: http://localhost:8000/ping → `{ "status": "ok" }`
- Docs: http://localhost:8000/docs
- OAuth login: http://localhost:8000/login (redirects to Spotify, then back to frontend with `#access_token=...`)
- WebSocket: `ws://127.0.0.1:8000/ws/gestures`

Gesture mapping is loaded from `backend/gestures.json` at startup.

### Frontend (Vite + React)

1) Install dependencies and run dev server:

```powershell
cd frontend
npm install
npm run dev
```

Default dev URL: http://localhost:5173

2) Login with Spotify: Use the “Login with Spotify” button (or visit `http://localhost:8000/login`) to authorize. The frontend stores the access token under `localStorage['spotify_access_token']`.

## Usage

- Enable gestures in the UI. When a WebSocket client is connected, the backend opens the camera and starts detecting gestures.
- Default mappings (configurable via `backend/gestures.json`):
  - Thumb + middle pinch → toggle play/pause
  - Thumb + ring pinch → next track
  - Thumb + pinky pinch → previous track
  - Thumb + index distance (with right index raised) → volume control (0–100%)

- Top bar displays the current track title, artist, album art, and a progress bar. Controls (play/pause/next/previous) are synced with the Spotify Web Playback SDK.

## Gesture Usage

1) Prepare
- Open the frontend, log in with Spotify, and click “Enable Gestures”.
- Allow camera access in your browser when prompted.
- Ensure there is sufficient lighting and keep your hands within the camera frame.

2) Hand posture
- Left hand: used for pinches and distance measurement.
- Right hand: raise your right index finger to enable volume mode.

3) Gestures (default)
- Toggle Play/Pause: pinch Right thumb + middle finger.
- Next Track: pinch Right thumb + ring finger.
- Previous Track: pinch Right thumb + pinky finger.
- Volume: with Left index raised, adjust the distance between Right thumb tip and Right index tip — volume maps from near (0%) to far (100%).

4) Tips
- Gestures have a short cooldown to prevent accidental repeats.
- Keep the hand around mid-frame and at moderate distance from the camera.
- You can customize actions in `backend/gestures.json` and restart the backend.

## Architecture Overview

- Frontend (React + Tailwind)
  - Spotify Web Playback SDK
  - `SpotifyPlayerContext` manages the SDK, token, and controls
  - WebSocket client subscribes to `ws://127.0.0.1:8000/ws/gestures`
  - UI components: Sidebar, PlayerBar (top bar), SongList, etc.

- Backend (FastAPI)
  - OAuth with Spotify Accounts service
  - REST endpoints for search and playlists
  - GestureLoop (MediaPipe + OpenCV) broadcasts actions to WebSocket clients
  - Shared JSON config maps gestures → actions

## API/Endpoints

- `GET /login` → Spotify OAuth authorize
- `GET /callback?code=...` → OAuth callback, redirects to frontend with `#access_token=...`
- `GET /api/me/playlists` → user playlists (requires `Authorization: Bearer <token>`)
- `GET /api/playlists/{playlist_id}` → playlist detail
- `GET /api/playlists/{playlist_id}/tracks` → playlist tracks
- `GET /api/search?q=...` → search tracks + playlists
- `WS /ws/gestures` → JSON events like `{ action: 'toggle_play' }` or `{ action: 'volume_control', value: 42 }`

## Development Notes

- CORS allows `http://localhost:5173`.
- Frontend assumes backend at `http://localhost:8000` and WS at `ws://127.0.0.1:8000/ws/gestures`.
- Tokens are kept in-memory on the backend and in `localStorage` on the frontend (dev only).

## Reflection

- Context: Gesture-controlled playback is a great way to explore computer vision (MediaPipe), real-time messaging (WebSocket), and third-party SDKs (Spotify).
- Why this stack: FastAPI for a fast, typed Python backend; React + Vite for a crisp dev experience; Tailwind for rapid UI; Spotify SDK for seamless playback in browser; MediaPipe for robust hand tracking.
- Challenges: OAuth and Web Playback SDK device activation nuances; ensuring gesture throttling (cooldown) to prevent rapid repeated actions; keeping camera active only when needed; synchronizing UI state with SDK `player_state_changed`.
- Next steps: Optional backend endpoint to proxy `/me/player/currently-playing` for state resync on refresh; environment-driven URLs for frontend; better token/session storage; additional gestures (shuffle, like, seek scrub).

## Credits

- README structure adapted from a public template by Brenna Martenson — see the gist: [readme-template.md](https://gist.github.com/martensonbj/6bf2ec2ed55f5be723415ea73c4557c4)