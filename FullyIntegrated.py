import cv2
import time
import numpy as np
import HandTrackingModV2 as htm   # your hand tracking module
import pyautogui        # pip install pyautogui
from ctypes import cast, POINTER
from comtypes import CLSCTX_ALL
from pycaw.pycaw import AudioUtilities, IAudioEndpointVolume
import math
import keyboard
# ----------------- Config -----------------
wCam, hCam = 1280, 720
minDist, maxDist = 35, 250      # distance range (pixels) mapped to 0..100% volume
touch_thresh = 40               # threshold (pixels) for "touch" detection
debounce_media = 0.7            # seconds cooldown for media actions
minArea, maxArea = 500, 3000  # optional area filter for left hand bbox (tune for your setup)
# ------------------------------------------

cap = cv2.VideoCapture(0)
cap.set(3, wCam)
cap.set(4, hCam)
pTime = 0

detector = htm.handDetector(detectionCon=0.7)

# audio (pycaw)
devices = AudioUtilities.GetSpeakers()
interface = devices.Activate(IAudioEndpointVolume._iid_, CLSCTX_ALL, None)
volume = cast(interface, POINTER(IAudioEndpointVolume))
volRange = volume.GetVolumeRange()   # we don't set a fixed level at startup

# persistent UI values
volBar = 400
volPer = 0

# debounce state for media actions
# Debounce variables
cooldown = 0.5 # seconds between allowed actions
last_action_time = 0

def bbox_area(b):
    if not b: return 0
    return max(0, (b[2] - b[0])) * max(0, (b[3] - b[1]))

while True:
    success, img = cap.read()
    img = detector.findHands(img)

    leftHandLmList, rightFingers = [], None
    volBar, volPer = 400, 0

    # --- Detect both hands ---
    if detector.results.multi_hand_landmarks:
        for handNo in range(len(detector.results.multi_hand_landmarks)):
            lmList, bbox = detector.findPosition(img, handNo, draw=True)
            if not lmList:
                continue

            # Hand label from Mediapipe
            label = detector.results.multi_handedness[handNo].classification[0].label

            if label == "Left":
                leftHandLmList = lmList
                leftBbox = bbox  # save for area filtering

            elif label == "Right":
                rightFingers = detector.fingersUp(lmList)

    # --- Control Logic ---
    if leftHandLmList:  # Left hand detected
        xmin, ymin, xmax, ymax = leftBbox
        area = (xmax - xmin) * (ymax - ymin)//100

        if minArea < area < maxArea:   # ✅ Only process gestures if left hand is in range
            if rightFingers and rightFingers[1] == 1:
                # ---------------- Volume Control Mode ----------------
                length, img, lineinfo = detector.findDistance(4, 8, img, lmList=leftHandLmList)

                volBar = np.interp(length, [35, 250], [400, 150])
                volPer = np.interp(length, [35, 250], [0, 100])
                volume.SetMasterVolumeLevelScalar(volPer / 100, None)

                cv2.circle(img, (lineinfo[4], lineinfo[5]), 15, (0, 255, 0), cv2.FILLED)
                cv2.putText(img, f'Vol:{int(volPer)} %', (400, 100),
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2)
                cv2.putText(img, "MODE: Volume", (900, 70),
                            cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2)

            else:
                # ---------------- Media Control Mode ----------------
                cv2.putText(img, "MODE: Media Control", (900, 70),
                            cv2.FONT_HERSHEY_PLAIN, 2, (255, 0, 0), 2)

                current_time = time.time()

                # Pause/Resume (Thumb + Middle)
                length, img, lineInfo = detector.findDistance(4, 12, img, lmList=leftHandLmList)
                if length < 40 and current_time - last_action_time > cooldown:
                    keyboard.send("play/pause media")
                    last_action_time = current_time

                # Next Track (Thumb + Ring)
                length, img, lineInfo = detector.findDistance(4, 16, img, lmList=leftHandLmList)
                if length < 40 and current_time - last_action_time > cooldown:
                    keyboard.send("next track")
                    last_action_time = current_time

                # Previous Track (Thumb + Pinky)
                length, img, lineInfo = detector.findDistance(4, 20, img, lmList=leftHandLmList)
                if length < 40 and current_time - last_action_time > cooldown:
                    keyboard.send("previous track")
                    last_action_time = current_time

    # --- Volume bar drawing (only in volume mode) ---
    if rightFingers and rightFingers[1] == 1:
        cv2.rectangle(img, (50, 150), (85, 400), (0, 255, 0), 3)
        cv2.rectangle(img, (50, int(volBar)), (85, 400), (0, 255, 0), cv2.FILLED)
        cv2.putText(img, f'{int(volPer)} %', (40, 450),
                    cv2.FONT_HERSHEY_COMPLEX, 1, (0, 255, 0), 3)

        cVol = int(volume.GetMasterVolumeLevelScalar() * 100)
        cv2.putText(img, f'Vol set:{int(cVol)}', (400, 50),
                    cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 0), 3)

    # --- FPS display ---
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(img, f'FPS:{int(fps)}', (10, 70),
                cv2.FONT_HERSHEY_PLAIN, 3, (255, 0, 255), 3)

    
    cv2.waitKey(1)
