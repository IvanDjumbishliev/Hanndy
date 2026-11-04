import type { Results } from '@mediapipe/hands';
import type { GestureResult } from './gestures';

export type HandTrackingResults = Results;
export type FrameRenderer = (
  context: CanvasRenderingContext2D,
  results: HandTrackingResults,
  renderSkeleton: () => void,
) => void;

export interface PerformanceMeasurement {
  fps: number;
  inferenceTime: number;
}

export interface GestureHistoryItem {
  id: number;
  gesture: GestureResult;
  detectedAt: number;
}
