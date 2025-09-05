from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.websockets import WebSocketState
import asyncio
from ..services.gestures import MockGestureService


router = APIRouter()


@router.websocket("/ws/gestures")
async def websocket_gestures(ws: WebSocket):
    await ws.accept()
    service = MockGestureService()
    try:
        async for event in service.stream_events(interval_seconds=5):
            if ws.application_state != WebSocketState.CONNECTED:
                break
            await ws.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        try:
            await ws.close()
        except Exception:
            pass


