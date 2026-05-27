import "@a1rth/css-normalize";
import "./style.css";

import setupCamera from "./setupCamera";
import { ERRORS } from "./errors";
import initGestureDetection from "./initGestureRecognizer";
import {
  DrawingUtils,
  GestureRecognizer,
  type GestureRecognizerResult,
} from "@mediapipe/tasks-vision";

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

const DETECTION_INTERVAL = 50;

const drawFrame = () => {
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

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
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;

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
      const textY = landmarks[0].y * canvas.height - 30;

      ctx.strokeText(displayText, textX, textY);
      ctx.fillText(displayText || "", textX, textY);
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
