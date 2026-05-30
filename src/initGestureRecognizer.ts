import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

const delegateValue = localStorage.getItem("delegate") || "GPU";
const delegateButton = document.getElementById("delegate") as HTMLButtonElement;
const additionalInfoSpan = document.getElementById(
  "additional",
) as HTMLSpanElement;

additionalInfoSpan.textContent = `⏳Loading...⏳`;

delegateButton.textContent = `Delegate: ${delegateValue}`;

console.log(delegateValue);

const initGestureRecognizer = async (
  context2D: CanvasRenderingContext2D,
): Promise<{
  gestureRecognizer: GestureRecognizer;
  drawingUtils: DrawingUtils;
}> => {
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",
    );

    const gestureRecognizer = await GestureRecognizer.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: (delegateValue as "GPU" | "CPU") || "GPU",
        },
        numHands: 2,
        runningMode: "VIDEO",
      },
    );

    const drawingUtils = new DrawingUtils(context2D);

    console.log("Gesture Recognizer ready");

    return {
      gestureRecognizer,
      drawingUtils,
    };
  } catch (error) {
    additionalInfoSpan.textContent =
      "Model installing failed, reload page and try again";
    throw error;
  } finally {
    additionalInfoSpan.textContent =
      "If you have some issues try change delegate to CPU";
  }
};

delegateButton.addEventListener("click", () => {
  const isGpu = delegateValue === "GPU";

  localStorage.setItem("delegate", isGpu ? "CPU" : "GPU");

  delegateButton.textContent = `Delegate: ${delegateValue}`;

  location.reload();
});

export default initGestureRecognizer;
