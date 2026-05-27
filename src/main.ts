import "@a1rth/css-normalize";
import "./style.css";

import setupCamera from "./setupCamera";
import { ERRORS } from "./errors";
import initGestureDetection from "./initGestureRecognizer";
import {
  DrawingUtils,
  GestureRecognizer,
  type GestureRecognizerResult,
  type Landmark,
} from "@mediapipe/tasks-vision";
import getDistance from "./utils/getDistance";

const TIPS_IDS = {
  THUMP_TIP: 4,
  INDEX_FINGER_TIP: 8,
  MIDDLE_FINGER_TIP: 12,
  RING_FINGER_TIP: 16,
  PINKY_TIP: 20,
} as const;

const FINGER_NAMES = {
  4: "Thump",
  8: "Index",
  12: "Middle",
  16: "Ring",
  20: "Pinky",
};

const video = document.getElementById("video") as HTMLVideoElement | null;
const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

if (!video) throw new Error(ERRORS.VIDEO_NOT_FOUND);
if (!canvas) throw new Error(ERRORS.CANVAS_NOT_FOUND);

const ctx = canvas.getContext("2d");

if (!ctx) throw new Error(ERRORS.CONTEXT_NOT_FOUND);

let gestureRecognizer: GestureRecognizer | null = null,
  drawingUtils: DrawingUtils | null = null;

let lastVideoTime = -1;
let lastDetectionTime = 0;
let lastResults: GestureRecognizerResult | null = null;

const DETECTION_INTERVAL = 1;

const drawFrame = () => {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.font = "20px Arial";
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;

  const now = performance.now();

  if (gestureRecognizer && video.currentTime > 0) {
    if (
      video.currentTime !== lastVideoTime &&
      now - lastDetectionTime >= DETECTION_INTERVAL
    ) {
      lastVideoTime = video.currentTime;
      lastDetectionTime = now;

      lastResults = gestureRecognizer.recognizeForVideo(canvas, now);
    }
  }

  if (lastResults?.landmarks?.length) {
    let leftHandLandmarks: Landmark[] | null = null;
    let rightHandLandmarks: Landmark[] | null = null;

    for (let i = 0; i < lastResults.landmarks.length; i++) {
      const handType =
        lastResults.handedness[i][0].displayName ||
        lastResults.handedness[i][0].categoryName;

      if (handType === "Left") {
        leftHandLandmarks = lastResults.landmarks[i];
      } else if (handType === "Right") {
        rightHandLandmarks = lastResults.landmarks[i];
      }
    }

    if (leftHandLandmarks && rightHandLandmarks) {
      let score = 0;

      for (const [_, value] of Object.entries(TIPS_IDS)) {
        const leftTip = leftHandLandmarks[value];
        const rightTip = rightHandLandmarks[value];

        const distanceBetweenTips = getDistance(leftTip, rightTip);

        if (distanceBetweenTips < 0.05) score++;
      }

      if (score === 5) {
        const text = "Кислинка";
        const textWidth = ctx.measureText(text).width;

        ctx.strokeText(text, (canvas.width - textWidth) / 2, 50);
        ctx.fillText(text, (canvas.width - textWidth) / 2, 50);
      }
    }

    lastResults.landmarks.forEach((landmarks, i) => {
      const handedness =
        lastResults?.handedness[i][0].displayName ||
        lastResults?.handedness[i][0].categoryName;

      const gesture = lastResults?.gestures[i][0];
      const gestureName = gesture?.categoryName || "None";
      const gestureScore = gesture?.score ? Math.round(gesture.score * 100) : 0;

      drawingUtils?.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        { color: "#00ff88", lineWidth: 4 },
      );

      drawingUtils?.drawLandmarks(landmarks, {
        color: "#ff0088",
        radius: 5,
      });

      const displayText = `${handedness}: ${gestureName} (${gestureScore})`;

      const textX = landmarks[0].x * canvas.width;
      const textY = landmarks[0].y * canvas.height + 30;

      ctx.strokeText(displayText, textX, textY);
      ctx.fillText(displayText, textX, textY);

      for (const [_, value] of Object.entries(TIPS_IDS)) {
        const tip = landmarks[value];

        const tipTextX = tip.x * canvas.width;
        const tipTextY = tip.y * canvas.height - 10;

        ctx.strokeText(FINGER_NAMES[value], tipTextX, tipTextY);
        ctx.fillText(FINGER_NAMES[value], tipTextX, tipTextY);
      }
    });
  }

  ctx.restore();

  requestAnimationFrame(drawFrame);
};

(async () => {
  await setupCamera(video, canvas);
  const result = await initGestureDetection(ctx);
  gestureRecognizer = result.gestureRecognizer;
  drawingUtils = result.drawingUtils;
  drawFrame();
})();
