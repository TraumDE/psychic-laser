import { ERRORS } from "./errors";

const setupCamera = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
): Promise<HTMLVideoElement> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
      },
    });

    video.srcObject = stream;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.play();
        resolve(video);
      };
    });
  } catch (error) {
    console.error(ERRORS.SETUP_CAMERA_FAIL, error);

    alert("Fail to get camera access");

    throw error;
  }
};

export default setupCamera;
