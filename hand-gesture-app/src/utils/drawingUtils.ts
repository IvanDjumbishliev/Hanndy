import '@mediapipe/drawing_utils';
import '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';

export interface Point {
  x: number;
  y: number;
}

export const drawHandSkeleton = (
  ctx: CanvasRenderingContext2D,
  results: Results,
): void => {
  if (!results.multiHandLandmarks) return;

  const drawConnectors = window.drawConnectors;
  const drawLandmarks = window.drawLandmarks;
  const HAND_CONNECTIONS = window.HAND_CONNECTIONS;

  for (const landmarks of results.multiHandLandmarks) {
    if (drawConnectors && HAND_CONNECTIONS) {
      drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
        color: '#00FF00',
        lineWidth: 5
      });
    }
    if (drawLandmarks) {
      drawLandmarks(ctx, landmarks, {
        color: '#FF0000',
        lineWidth: 2
      });
    }
  }
};

export const drawLine = (
  ctx: CanvasRenderingContext2D,
  start: Point,
  end: Point,
  color: string,
  width: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
};
