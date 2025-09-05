from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services.websocket_manager import manager


router = APIRouter()


@router.websocket("/ws/gestures")
async def websocket_gestures(ws: WebSocket):
    try:
        await manager.connect(ws)
        while True:
            # Keep the socket open; no need to receive messages in this direction
            data = await ws.receive_text()
            # Optional: handle ping/pong or client messages in the future
    except WebSocketDisconnect:
        await manager.disconnect(ws)


