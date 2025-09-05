import cv2
import mediapipe as mp
import math
from typing import List, Tuple


class HandDetector:
    def __init__(self, mode: bool = False, maxHands: int = 2, detectionCon: float = 0.5, trackCon: float = 0.5):
        self.mode = mode
        self.maxHands = maxHands
        self.detectionCon = detectionCon
        self.trackCon = trackCon

        self.mpHands = mp.solutions.hands
        self.hands = self.mpHands.Hands(
            static_image_mode=self.mode,
            max_num_hands=self.maxHands,
            min_detection_confidence=self.detectionCon,
            min_tracking_confidence=self.trackCon,
        )
        self.mpDraw = mp.solutions.drawing_utils
        self.tipIds = [4, 8, 12, 16, 20]
        self.results = None
        self.lmList: List[List[int]] = []

    def findHands(self, img, draw: bool = True):
        imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        self.results = self.hands.process(imgRGB)
        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(img, handLms, self.mpHands.HAND_CONNECTIONS)
        return img

    def findPosition(self, img, handNo: int = 0, draw: bool = True):
        xList, yList = [], []
        lmList: List[List[int]] = []
        bbox: Tuple[int, int, int, int] = (0, 0, 0, 0)
        if self.results and self.results.multi_hand_landmarks:
            myHand = self.results.multi_hand_landmarks[handNo]
            for idx, lm in enumerate(myHand.landmark):
                h, w, _ = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                xList.append(cx)
                yList.append(cy)
                lmList.append([idx, cx, cy])
                if draw:
                    cv2.circle(img, (cx, cy), 7, (255, 0, 255), cv2.FILLED)
            if xList and yList:
                xmin, xmax = min(xList), max(xList)
                ymin, ymax = min(yList), max(yList)
                bbox = (xmin, ymin, xmax, ymax)
                if draw:
                    cv2.rectangle(img, (bbox[0] - 20, bbox[1] - 20), (bbox[2] + 20, bbox[3] + 20), (0, 255, 0), 2)
        self.lmList = lmList
        return lmList, bbox

    def fingersUp(self, lmList=None):
        if lmList is None:
            if not self.lmList:
                return []
            lmList = self.lmList
        fingers = []
        # Thumb
        fingers.append(1 if lmList[self.tipIds[0]][1] > lmList[self.tipIds[0] - 1][1] else 0)
        # Other fingers
        for i in range(1, 5):
            fingers.append(1 if lmList[self.tipIds[i]][2] < lmList[self.tipIds[i] - 2][2] else 0)
        return fingers

    def findDistance(self, p1: int, p2: int, img, lmList=None, draw: bool = True, r: int = 15, t: int = 3):
        if lmList is None:
            lmList = self.lmList
        x1, y1 = lmList[p1][1], lmList[p1][2]
        x2, y2 = lmList[p2][1], lmList[p2][2]
        cx, cy = (x1 + x2) // 2, (y1 + y2) // 2
        if draw:
            cv2.circle(img, (x1, y1), r, (255, 0, 255), cv2.FILLED)
            cv2.circle(img, (x2, y2), r, (255, 0, 255), cv2.FILLED)
            cv2.line(img, (x1, y1), (x2, y2), (255, 0, 255), t)
            cv2.circle(img, (cx, cy), r, (255, 0, 255), cv2.FILLED)
        length = math.hypot(x2 - x1, y2 - y1)
        return length, img, [x1, y1, x2, y2, cx, cy]


