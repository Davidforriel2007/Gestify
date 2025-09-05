import asyncio
from typing import AsyncIterator, Dict, List, Union


GestureEvent = Union[str, Dict[str, int], Dict[str, Union[str, int]]]


class MockGestureService:
    """Simulates gesture detection by rotating through mock events."""

    def __init__(self) -> None:
        self._events: List[GestureEvent] = [
            {"action": "toggle_play"},
            {"action": "next_track"},
            {"action": "previous_track"},
            {"action": "volume_control", "value": 50},
        ]

    async def stream_events(self, interval_seconds: float = 5.0) -> AsyncIterator[Dict[str, Union[str, int]]]:
        index = 0
        while True:
            event = self._events[index % len(self._events)]
            index += 1
            # Ensure event is dict
            if isinstance(event, str):
                payload = {"action": event}
            else:
                payload = event
            yield payload
            await asyncio.sleep(interval_seconds)


