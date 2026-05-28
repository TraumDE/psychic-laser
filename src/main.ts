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
import createThrottleValue from "./utils/createThrottleValue";

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

const DEBUG = false;

const video = document.getElementById("video") as HTMLVideoElement | null;
const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
if (!video) throw new Error(ERRORS.VIDEO_NOT_FOUND);
if (!canvas) throw new Error(ERRORS.CANVAS_NOT_FOUND);

const ctx = canvas.getContext("2d");
if (!ctx) throw new Error(ERRORS.CONTEXT_NOT_FOUND);

const offsetCanvas = document.createElement("canvas");
const oCtx = offsetCanvas.getContext("2d");
if (!oCtx) throw new Error(ERRORS.OFFSCREEN_CONTEXT_NOT_CREATE);

const chromeCanvas = document.createElement("canvas");
const chCtx = chromeCanvas.getContext("2d");
if (!chCtx) throw new Error(ERRORS.CHROME_CONTEXT_NOT_CREATE);

let gestureRecognizer: GestureRecognizer | null = null,
  drawingUtils: DrawingUtils | null = null;

let lastVideoTime = -1;
let lastDetectionTime = 0;
let lastResults: GestureRecognizerResult | null = null;

let activated = createThrottleValue(false, 1000);

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

        if (distanceBetweenTips < 0.1) score++;
      }

      if (score === 5) activated.set(!activated.get());

      console.log(activated.get());
    }

    if (leftHandLandmarks && rightHandLandmarks && activated.get()) {
      const leftTipsPixels = Object.entries(TIPS_IDS).map(([_, value]) => ({
        x: leftHandLandmarks[value].x * canvas.width,
        y: leftHandLandmarks[value].y * canvas.height,
      }));

      const rightTipsPixels = Object.entries(TIPS_IDS).map(([_, value]) => ({
        x: rightHandLandmarks[value].x * canvas.width,
        y: rightHandLandmarks[value].y * canvas.height,
      }));

      chCtx.clearRect(0, 0, chromeCanvas.width, chromeCanvas.height);
      chCtx.filter = "blur(5px) contrast(7) brightness(1.2) saturate(0)";
      chCtx.drawImage(
        video,
        -10,
        -10,
        chromeCanvas.width + 20,
        chromeCanvas.height + 20,
      );
      chCtx.filter = "none";

      oCtx.clearRect(0, 0, offsetCanvas.width, offsetCanvas.height);
      oCtx.drawImage(chromeCanvas, 0, 0);
      oCtx.save();
      oCtx.globalCompositeOperation = "multiply";
      oCtx.fillStyle = "#ff0000";
      oCtx.fillRect(0, 0, offsetCanvas.width, offsetCanvas.height);
      oCtx.restore();

      chCtx.save();
      chCtx.globalCompositeOperation = "multiply";
      chCtx.fillStyle = "#00ffff";
      chCtx.fillRect(0, 0, chromeCanvas.width, chromeCanvas.height);
      chCtx.restore();

      for (let i = 0; i < leftTipsPixels.length; i++) {
        const next = (i + 1) % leftTipsPixels.length;

        ctx.save();

        ctx.beginPath();
        ctx.moveTo(leftTipsPixels[i].x, leftTipsPixels[i].y);
        ctx.lineTo(rightTipsPixels[i].x, rightTipsPixels[i].y);
        ctx.lineTo(rightTipsPixels[next].x, rightTipsPixels[next].y);
        ctx.lineTo(leftTipsPixels[next].x, leftTipsPixels[next].y);
        ctx.closePath();

        ctx.clip();

        const shift = 3;

        ctx.drawImage(chromeCanvas, shift, 0);

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.drawImage(offsetCanvas, -shift, 0);
        ctx.restore();

        const metalGrad = ctx.createLinearGradient(
          leftTipsPixels[i].x,
          leftTipsPixels[i].y,
          rightTipsPixels[next].x,
          rightTipsPixels[next].y,
        );

        metalGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
        metalGrad.addColorStop(0.25, "rgba(255, 255, 255, 0.0)");
        metalGrad.addColorStop(0.5, "rgba(0, 0, 0, 0.55)");
        metalGrad.addColorStop(0.75, "rgba(255, 255, 255, 0.0)");
        metalGrad.addColorStop(1, "rgba(255, 255, 255, 0.25)");

        ctx.fillStyle = metalGrad;
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = 3;
        ctx.restore();
      }
      // ctx.beginPath();

      // ctx.moveTo(leftTipsPixels[0].x, leftTipsPixels[0].y);
      // ctx.lineTo(rightTipsPixels[0].x, rightTipsPixels[0].y);
      // ctx.lineTo(rightTipsPixels[4].x, rightTipsPixels[4].y);
      // ctx.lineTo(leftTipsPixels[4].x, leftTipsPixels[4].y);

      // ctx.closePath();
      // ctx.stroke();

      // ctx.restore();
    }

    if (DEBUG) {
      lastResults.landmarks.forEach((landmarks, i) => {
        const handedness =
          lastResults?.handedness[i][0].displayName ||
          lastResults?.handedness[i][0].categoryName;

        const gesture = lastResults?.gestures[i][0];
        const gestureName = gesture?.categoryName || "None";
        const gestureScore = gesture?.score
          ? Math.round(gesture.score * 100)
          : 0;

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
  }

  ctx.restore();

  requestAnimationFrame(drawFrame);
};

(async () => {
  await setupCamera(video, canvas);
  const result = await initGestureDetection(ctx);
  gestureRecognizer = result.gestureRecognizer;
  drawingUtils = result.drawingUtils;

  chromeCanvas.width = canvas.width;
  chromeCanvas.height = canvas.height;
  offsetCanvas.width = canvas.width;
  offsetCanvas.height = canvas.height;

  drawFrame();
})();
