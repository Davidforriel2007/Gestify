from typing import Set, Dict, Any
from fastapi import WebSocket
import asyncio


class WebSocketManager:
    def __init__(self) -> None:
        self._clients: Set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self._clients.add(ws)

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            if ws in self._clients:
                self._clients.remove(ws)

    async def broadcast(self, event: Dict[str, Any]) -> None:
        async with self._lock:
            clients = list(self._clients)
        for ws in clients:
            try:
                await ws.send_json(event)
            except Exception:
                try:
                    await ws.close()
                except Exception:
                    pass
                await self.disconnect(ws)

    async def get_client_count(self) -> int:
        async with self._lock:
            return len(self._clients)


manager = WebSocketManager()


