import asyncio
import json
import cv2
import numpy as np
from typing import Dict, Any
from .hand_tracking import HandDetector
from .websocket_manager import manager


class GestureLoop:
    def __init__(self, mapping_path: str = "gestures.json") -> None:
        self.mapping_path = mapping_path
        self.detector = HandDetector(detectionCon=0.7)
        self.cap = None
        self.running = False
        self.minDist, self.maxDist = 35, 250
        self.cooldown_s = 0.5
        self._last_action_at: Dict[str, float] = {}
        self.mapping: Dict[str, Any] = {}
        # area gating similar to FullyIntegrated.py
        self.minArea, self.maxArea = 500, 3000

    def load_mapping(self) -> None:
        try:
            with open(self.mapping_path, "r", encoding="utf-8") as f:
                self.mapping = json.load(f)
        except Exception:
            # default mapping
            self.mapping = {
                "pinch_thumb_middle": "toggle_play",
                "pinch_thumb_ring": "next_track",
                "pinch_thumb_pinky": "previous_track",
                "pinch_thumb_index": "volume_control",
            }

    async def start(self) -> None:
        self.load_mapping()
        self.running = True
        try:
            while self.running:
                # Lazily open camera only if there are clients
                if not self.cap or not self.cap.isOpened():
                    if await manager.get_client_count() > 0:
                        self.cap = cv2.VideoCapture(0)
                        self.cap.set(3, 1280)
                        self.cap.set(4, 720)
                    else:
                        await asyncio.sleep(0.2)
                        continue

                ok, img = self.cap.read()
                if not ok:
                    await asyncio.sleep(0.05)
                    continue
                img = self.detector.findHands(img)

                leftHandLmList, rightFingers = [], None
                if self.detector.results and self.detector.results.multi_hand_landmarks:
                    for handNo in range(len(self.detector.results.multi_hand_landmarks)):
                        lmList, bbox = self.detector.findPosition(img, handNo, draw=False)
                        if not lmList:
                            continue
                        label = self.detector.results.multi_handedness[handNo].classification[0].label
                        if label == "Left":
                            leftHandLmList = lmList
                            leftBbox = bbox
                        elif label == "Right":
                            rightFingers = self.detector.fingersUp(lmList)

                if leftHandLmList:
                    # Optional area gating (using last computed bbox from findPosition when hand labeled Left)
                    try:
                        xmin, ymin, xmax, ymax = leftBbox  # type: ignore[name-defined]
                        area = (xmax - xmin) * (ymax - ymin) // 100
                    except Exception:
                        area = self.minArea + 1

                    if self.minArea < area < self.maxArea:
                        # Volume when right index up
                        if rightFingers and len(rightFingers) > 1 and rightFingers[1] == 1:
                            length, _, _ = self.detector.findDistance(4, 8, img, lmList=leftHandLmList, draw=False)
                            volPer = np.interp(length, [self.minDist, self.maxDist], [0, 100])
                            event = {"action": "volume_control", "value": int(volPer)}
                            await manager.broadcast(event)
                            await asyncio.sleep(0.05)
                        else:
                            # Media controls via pinches
                            await self._maybe_emit_pinch(leftHandLmList, 4, 12, self.mapping.get("pinch_thumb_middle"))
                            await self._maybe_emit_pinch(leftHandLmList, 4, 16, self.mapping.get("pinch_thumb_ring"))
                            await self._maybe_emit_pinch(leftHandLmList, 4, 20, self.mapping.get("pinch_thumb_pinky"))

                # If no clients anymore, release the camera
                if await manager.get_client_count() == 0 and self.cap and self.cap.isOpened():
                    self.cap.release()
                    self.cap = None

                await asyncio.sleep(0.01)
        finally:
            try:
                if self.cap:
                    self.cap.release()
            except Exception:
                pass

    async def stop(self) -> None:
        self.running = False

    async def _maybe_emit_pinch(self, lmList, p1: int, p2: int, action: str | None) -> None:
        if not action:
            return
        import time

        length, _, _ = self.detector.findDistance(p1, p2, np.zeros((1, 1, 3), dtype=np.uint8), lmList=lmList, draw=False)
        if length < 40:
            now = time.time()
            if now - self._last_action_at.get(action, 0) > self.cooldown_s:
                event = {"action": action}
                await manager.broadcast(event)
                self._last_action_at[action] = now


