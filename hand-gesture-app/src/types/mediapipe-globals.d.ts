import type { Camera } from '@mediapipe/camera_utils';
import type {
  Hands,
  HAND_CONNECTIONS as HandConnections,
} from '@mediapipe/hands';
import type {
  drawConnectors as DrawConnectors,
  drawLandmarks as DrawLandmarks,
} from '@mediapipe/drawing_utils';

declare global {
  interface Window {
    Camera: typeof Camera;
    Hands: typeof Hands;
    HAND_CONNECTIONS: typeof HandConnections;
    drawConnectors: typeof DrawConnectors;
    drawLandmarks: typeof DrawLandmarks;
  }
}

export {};
