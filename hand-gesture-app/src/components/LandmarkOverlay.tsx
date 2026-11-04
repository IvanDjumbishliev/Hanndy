import { useEffect, useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import { drawHandSkeleton } from '../utils/drawingUtils';
import type { FrameRenderer, HandTrackingResults } from '../types/tracking';
import '@mediapipe/drawing_utils';
import '@mediapipe/hands';

interface LandmarkOverlayProps {
  results: HandTrackingResults | null;
  drawingCanvasRef: RefObject<HTMLCanvasElement | null>;
  showSkeleton: boolean;
  renderFrame: FrameRenderer;
}

const LandmarkOverlay = ({
  results,
  drawingCanvasRef,
  showSkeleton,
  renderFrame,
}: LandmarkOverlayProps): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect((): (() => void) => {
    const resizeCanvas = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      if (drawingCanvasRef.current) {
        drawingCanvasRef.current.width = width;
        drawingCanvasRef.current.height = height;
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return (): void => window.removeEventListener('resize', resizeCanvas);
  }, [drawingCanvasRef]);

  useEffect((): void => {
    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!canvas || !drawingCanvas || !results) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    renderFrame(context, results, (): void => {
      if (showSkeleton) drawHandSkeleton(context, results);
    });
  }, [drawingCanvasRef, renderFrame, results, showSkeleton]);

  return (
    <>
      <canvas ref={drawingCanvasRef} className="drawing-canvas" hidden />
      <canvas ref={canvasRef} className="main-canvas" />
    </>
  );
};

export default LandmarkOverlay;
