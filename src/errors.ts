export const ERRORS = {
  SETUP_CAMERA_FAIL: "Failed to setup camera",
  VIDEO_NOT_FOUND: "Video element not found",
  CANVAS_NOT_FOUND: "Canvas element not found",
  CONTEXT_NOT_FOUND: "2D context not found",
} as const;

export type errorKeys = keyof typeof ERRORS;
