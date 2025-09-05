import cv2 
import mediapipe as mp
import time  #used for calculating fps
import math

class handDetector():
    def __init__(self,mode=False,maxHands=2,detectionCon=0.5,trackCon=0.5):
        self.mode=mode
        self.maxHands=maxHands
        self.detectionCon=detectionCon
        self.trackCon=trackCon

        self.mpHands=mp.solutions.hands
        self.hands=self.mpHands.Hands(static_image_mode=self.mode,
        max_num_hands=self.maxHands,
        min_detection_confidence=self.detectionCon,
        min_tracking_confidence=self.trackCon) #default parameters
        self.mpDraw=mp.solutions.drawing_utils #used to draw the landmarks and connections
        self.tipIds=[4,8,12,16,20]

    def findHands(self,img,draw=True):
        imgRGB=cv2.cvtColor(img,cv2.COLOR_BGR2RGB) #convert the image from BGR to RGB
        self.results=self.hands.process(imgRGB) #process the RGB image to find hands
        #print(results.multi_hand_landmarks) #check for something is detected or not

        if self.results.multi_hand_landmarks:
            for handLms in self.results.multi_hand_landmarks:
                if draw:
                    self.mpDraw.draw_landmarks(img,handLms,self.mpHands.HAND_CONNECTIONS) #draw the landmarks and connections on the original BGR image
            
        return img
            
    
    def findPosition(self, img, handNo=0, draw=True):
        xList, yList = [], []
        lmList = []
        bbox = []

        if self.results.multi_hand_landmarks:
            myHand = self.results.multi_hand_landmarks[handNo]

            for id, lm in enumerate(myHand.landmark):
                h, w, c = img.shape
                cx, cy = int(lm.x * w), int(lm.y * h)
                xList.append(cx)
                yList.append(cy)
                lmList.append([id, cx, cy])

                if draw:
                    cv2.circle(img, (cx, cy), 7, (255, 0, 255), cv2.FILLED)

            xmin, xmax = min(xList), max(xList)
            ymin, ymax = min(yList), max(yList)
            bbox = (xmin, ymin, xmax, ymax)

            if draw:
                cv2.rectangle(img, (bbox[0] - 20, bbox[1] - 20),
                            (bbox[2] + 20, bbox[3] + 20), (0, 255, 0), 2)
        
        self.lmList = lmList
        return lmList, bbox
    
    def fingersUp(self, lmList=None):
        if lmList is None:
            if not hasattr(self, "lmList") or len(self.lmList) == 0:
                return []   # return empty if no landmarks
            lmList = self.lmList

        fingers = []
        # Thumb
        if lmList[self.tipIds[0]][1] > lmList[self.tipIds[0]-1][1]:
            fingers.append(1)
        else:
            fingers.append(0)

        # Other 4 fingers
        for id in range(1, 5):
            if lmList[self.tipIds[id]][2] < lmList[self.tipIds[id]-2][2]:
                fingers.append(1)
            else:
                fingers.append(0)
        return fingers

    
    def findDistance(self, p1, p2, img, lmList=None, draw=True, r=15, t=3):
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

def main():
    pTime=0 #previous time
    cTime=0 #current time
    cap =cv2.VideoCapture(0) #0 for default camera, 1 for external camera
    #open the webcam, cap is now the object that contains the webcam feed
    detector=handDetector()

    while True: #keep the camera on
        success, img =cap.read()
        img= detector.findHands(img)

        if detector.results.multi_hand_landmarks:
            for handNo in range(len(detector.results.multi_hand_landmarks)):
                lmList, bbox = detector.findPosition(img, handNo, draw=True)
                if len(lmList) != 0:
                    print(f"Hand {handNo}: bbox={bbox}")
                    # Example: print thumb tip position
                    print("Thumb tip:", lmList[4])  

        cTime=time.time() #get the current time
        fps=1/(cTime-pTime) #calculate fps
        pTime=cTime #update previous time to current time

        cv2.putText(img,str(int(fps)),(10,70),cv2.FONT_HERSHEY_PLAIN,3,(255,0,255),3)

        cv2.imshow("Image",img)
        cv2.waitKey(1)


if __name__ == "__main__":
    main()