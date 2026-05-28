export const ERRORS = {
  SETUP_CAMERA_FAIL: "Failed to setup camera",
  VIDEO_NOT_FOUND: "Video element not found",
  CANVAS_NOT_FOUND: "Canvas element not found",
  CONTEXT_NOT_FOUND: "2D context not found",
  OFFSCREEN_CONTEXT_NOT_CREATE: "Failed create offscreen context",
  CHROME_CONTEXT_NOT_CREATE: "Failed create chrome context",
} as const;

export type ErrorKeys = keyof typeof ERRORS;
