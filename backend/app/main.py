from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes.gestures import router as gestures_router


app = FastAPI(title="Gestify Backend", version="0.1.0")

# CORS: allow local frontend during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/ping")
async def ping():
    return {"status": "ok"}


app.include_router(gestures_router)


