import "@a1rth/css-normalize";
import "./style.css";

import setupCamera from "./setupCamera";
import { ERRORS } from "./errors";

const video = document.getElementById("video") as HTMLVideoElement | null;
const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;

if (!video) throw new Error(ERRORS.VIDEO_NOT_FOUND);
if (!canvas) throw new Error(ERRORS.CANVAS_NOT_FOUND);

const ctx = canvas.getContext("2d");

if (!ctx) throw new Error(ERRORS.CONTEXT_NOT_FOUND);

const drawFrame = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  requestAnimationFrame(drawFrame);
};

setupCamera(video, canvas).then(() => {
  drawFrame();
});
