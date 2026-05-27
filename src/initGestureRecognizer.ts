import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "@mediapipe/tasks-vision";

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
          delegate: "GPU",
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
    throw error;
  }
};

export default initGestureRecognizer;
