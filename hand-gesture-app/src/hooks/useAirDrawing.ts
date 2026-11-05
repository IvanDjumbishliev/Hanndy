import { useCallback, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { FrameRenderer, HandTrackingResults } from '../types/tracking';
import type { Point } from '../utils/drawingUtils';
import { drawLine } from '../utils/drawingUtils';
import { detectShape } from '../utils/gestureUtils';

export type DrawingTool = 'freehand' | 'shape';
export type DrawingViewMode = '2d' | '3d';

interface Point3D extends Point {
  z: number;
}

export interface DrawingLine3D {
  points: Point3D[];
  color: string;
  size: number;
}

interface UseAirDrawingOptions {
  drawingCanvasRef: RefObject<HTMLCanvasElement | null>;
  activeTool: DrawingTool;
  brushColor: string;
  brushSize: number;
  isDynamicSize: boolean;
  viewMode: DrawingViewMode;
}

interface AirDrawingState {
  lines3D: DrawingLine3D[];
  activeLine3D: Point3D[];
  renderFrame: FrameRenderer;
  undo: () => void;
  clearCanvas: () => void;
  saveImage: () => void;
}

const pointDistance = (first: Point, second: Point): number =>
  Math.sqrt(Math.pow(first.x - second.x, 2) + Math.pow(first.y - second.y, 2));

export const useAirDrawing = ({
  drawingCanvasRef,
  activeTool,
  brushColor,
  brushSize,
  isDynamicSize,
  viewMode,
}: UseAirDrawingOptions): AirDrawingState => {
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [lines3D, setLines3D] = useState<DrawingLine3D[]>([]);
  const [activeLine3D, setActiveLine3D] = useState<Point3D[]>([]);
  const currentPathRef = useRef<Point[]>([]);
  const historyRef = useRef<ImageData[]>([]);
  const smoothedPos = useRef<Point3D>({ x: 0.5, y: 0.5, z: 0.5 });
  const gestureCooldown = useRef<number>(0);

  const saveHistory = useCallback((): void => {
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    historyRef.current.push(context.getImageData(0, 0, canvas.width, canvas.height));
    if (historyRef.current.length > 10) historyRef.current.shift();
  }, [drawingCanvasRef]);

  const undo = useCallback((): void => {
    if (viewMode === '3d') {
      setLines3D((previous: DrawingLine3D[]): DrawingLine3D[] => previous.slice(0, -1));
      return;
    }
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context || historyRef.current.length === 0) return;
    const previousState = historyRef.current.pop();
    if (context && previousState) context.putImageData(previousState, 0, 0);
  }, [drawingCanvasRef, viewMode]);

  const clearCanvas = useCallback((): void => {
    if (viewMode === '3d') {
      setLines3D([]);
      setActiveLine3D([]);
      return;
    }
    const canvas = drawingCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    saveHistory();
    context.clearRect(0, 0, canvas.width, canvas.height);
  }, [drawingCanvasRef, saveHistory, viewMode]);

  const saveImage = useCallback((): void => {
    const source = drawingCanvasRef.current;
    if (!source) return;
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.fillStyle = '#1a1a1a';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0);
    const link = document.createElement('a');
    link.download = `air-draw-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, [drawingCanvasRef]);

  const renderFrame = useCallback((
    context: CanvasRenderingContext2D,
    results: HandTrackingResults,
    renderSkeleton: () => void,
  ): void => {
    const canvas = drawingCanvasRef.current;
    const drawingContext = canvas?.getContext('2d');
    if (!canvas || !drawingContext) return;
    context.save();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.drawImage(canvas, 0, 0, context.canvas.width, context.canvas.height);
    renderSkeleton();

    const landmarks = results.multiHandLandmarks[0];
    if (landmarks) {
      const indexTip = landmarks[8];
      const thumbTip = landmarks[4];
      const smoothingAlpha = 0.4;
      smoothedPos.current.x = smoothedPos.current.x * (1 - smoothingAlpha) + indexTip.x * smoothingAlpha;
      smoothedPos.current.y = smoothedPos.current.y * (1 - smoothingAlpha) + indexTip.y * smoothingAlpha;
      smoothedPos.current.z = smoothedPos.current.z * (1 - smoothingAlpha) + indexTip.z * smoothingAlpha;

      const x = smoothedPos.current.x * context.canvas.width;
      const y = smoothedPos.current.y * context.canvas.height;
      let currentBrushSize = brushSize;
      if (activeTool === 'freehand' && isDynamicSize) {
        const handSize = pointDistance(landmarks[0], landmarks[9]);
        const ratio = (handSize - 0.05) / (0.25 - 0.05);
        currentBrushSize = 2 + Math.max(0, Math.min(1, ratio)) * 28;
      }

      const pinchDistance = pointDistance(indexTip, thumbTip);
      const isPinching = pinchDistance < 0.08;
      const isFist = [8, 12, 16, 20].every((tipIndex: number): boolean =>
        pointDistance(landmarks[tipIndex], landmarks[0]) < 0.12);

      if (isFist && Date.now() - gestureCooldown.current > 1000) {
        undo();
        gestureCooldown.current = Date.now();
      }

      if (isPinching) {
        if (!isDrawing) {
          setIsDrawing(true);
          setLastPoint({ x, y });
          currentPathRef.current = [{ x, y }];
          if (viewMode === '3d') {
            setActiveLine3D([{
              x: (smoothedPos.current.x - 0.5) * 20,
              y: (0.5 - smoothedPos.current.y) * 20,
              z: (1 - smoothedPos.current.z) * 10 - 5,
            }]);
          } else {
            saveHistory();
          }
        } else if (viewMode === '3d') {
          setActiveLine3D((previous: Point3D[]): Point3D[] => [...previous, {
            x: (smoothedPos.current.x - 0.5) * 20,
            y: (0.5 - smoothedPos.current.y) * 20,
            z: (1 - smoothedPos.current.z) * 10 - 5,
          }]);
        } else {
          if (activeTool === 'freehand' && lastPoint) {
            drawLine(drawingContext, lastPoint, { x, y }, brushColor, currentBrushSize);
          } else if (activeTool === 'shape') {
            context.beginPath();
            context.strokeStyle = brushColor;
            context.lineWidth = brushSize;
            const start = currentPathRef.current[0];
            if (start) {
              context.moveTo(start.x, start.y);
              currentPathRef.current.slice(1).forEach((point: Point): void => context.lineTo(point.x, point.y));
              context.stroke();
            }
          }
        }
        setLastPoint({ x, y });
        currentPathRef.current.push({ x, y });
      } else if (isDrawing) {
        setIsDrawing(false);
        setLastPoint(null);
        if (viewMode === '3d') {
          setLines3D((previous: DrawingLine3D[]): DrawingLine3D[] => [
            ...previous,
            { points: activeLine3D, color: brushColor, size: brushSize },
          ]);
          setActiveLine3D([]);
        } else if (activeTool === 'shape') {
          drawDetectedShape(drawingContext, currentPathRef.current, brushColor, brushSize);
        }
        currentPathRef.current = [];
      }
      context.beginPath();
      context.arc(x, y, currentBrushSize / 2, 0, 2 * Math.PI);
      context.fillStyle = brushColor;
      context.fill();
      context.strokeStyle = '#fff';
      context.stroke();
    }
    context.restore();
  }, [
    activeLine3D, activeTool, brushColor, brushSize, drawingCanvasRef, isDrawing, isDynamicSize,
    lastPoint, saveHistory, undo, viewMode,
  ]);

  return { lines3D, activeLine3D, renderFrame, undo, clearCanvas, saveImage };
};

const drawDetectedShape = (
  context: CanvasRenderingContext2D,
  path: Point[],
  color: string,
  brushSize: number,
): void => {
  const shape = detectShape(path);
  if (!shape) return;
  context.beginPath();
  context.strokeStyle = color;
  context.lineWidth = brushSize;
  const xValues = path.map((point: Point): number => point.x);
  const yValues = path.map((point: Point): number => point.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  const width = maxX - minX;
  const height = maxY - minY;
  if (shape === 'circle') context.arc(minX + width / 2, minY + height / 2, Math.max(width, height) / 2, 0, 2 * Math.PI);
  else if (shape === 'rectangle') context.strokeRect(minX, minY, width, height);
  else {
    const start = path[0];
    const end = path[path.length - 1];
    if (start && end) {
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
    }
  }
  context.stroke();
};
