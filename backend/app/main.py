from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.gestures import router as gestures_router
from .routes.auth import router as auth_router
from .routes.spotify import router as spotify_router
from .config.settings import get_settings
from .services.gesture_loop import GestureLoop
import asyncio

settings = get_settings()


app = FastAPI(title="Gestify Backend", version="0.1.0")

# CORS: allow local frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
async def ping():
    return {"status": "ok"}


app.include_router(gestures_router)
app.include_router(auth_router)
app.include_router(spotify_router)


gesture_loop: GestureLoop | None = None


@app.on_event("startup")
async def on_startup():
    global gesture_loop
    # Start gesture loop in background
    gesture_loop = GestureLoop(mapping_path="gestures.json")
    asyncio.create_task(gesture_loop.start())


@app.on_event("shutdown")
async def on_shutdown():
    global gesture_loop
    if gesture_loop:
        await gesture_loop.stop()


