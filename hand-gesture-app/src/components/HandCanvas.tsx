import { useRef, useEffect, useState, useCallback } from 'react';
import type { ReactElement } from 'react';
import type { Results } from '@mediapipe/hands';
import type { Point } from '../utils/drawingUtils';
import { useHandTracking } from '../hooks/useHandTracking';
import { drawHandSkeleton, drawLine } from '../utils/drawingUtils';
import { detectShape } from '../utils/gestureUtils';
import ControlPanel from './ControlPanel';
import Scene3D from './Scene3D';
import type { Scene3DHandle } from './Scene3D';
import '../styles/HandCanvas.css';

type ActiveTool = 'freehand' | 'shape';
type ViewMode = '2d' | '3d';

interface Point3D {
    x: number;
    y: number;
    z: number;
}

interface DrawingLine3D {
    points: Point3D[];
    color: string;
    size: number;
}

const HandCanvas = (): ReactElement => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const { results }: { results: Results | null } = useHandTracking(videoRef, canvasRef);

    // UI State
    const [activeTool, setActiveTool] = useState<ActiveTool>('freehand');
    const [brushColor, setBrushColor] = useState<string>('#00FF00');
    const [brushSize, setBrushSize] = useState<number>(5);
    const [isDynamicSize, setIsDynamicSize] = useState<boolean>(false);
    const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [viewMode, setViewMode] = useState<ViewMode>('2d');
    const [isNeon, setIsNeon] = useState<boolean>(true);
    const [showGrid, setShowGrid] = useState<boolean>(true);
    const [autoRotate, setAutoRotate] = useState<boolean>(false);
    const scene3DRef = useRef<Scene3DHandle | null>(null);

    // Smoothed Landmarks state
    const smoothedPos = useRef<{ x: number; y: number; z: number }>({ x: 0.5, y: 0.5, z: 0.5 });
    const smoothingAlpha: number = 0.4; // 0 to 1, lower = smoother

    // Gesture Cooldown
    const gestureCooldown = useRef<number>(0);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    const [lastPoint, setLastPoint] = useState<Point | null>(null);
    const currentPathRef = useRef<Point[]>([]);
    const [lines3D, setLines3D] = useState<DrawingLine3D[]>([]);
    const [activeLine3D, setActiveLine3D] = useState<Point3D[]>([]);

    // History for Undo
    const historyRef = useRef<ImageData[]>([]);

    const handleExport3D = useCallback((): void => {
        if (scene3DRef.current) {
            scene3DRef.current.exportScene();
        }
    }, []);

    useEffect((): void => {
        if (results) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- The camera resolves hand tracking asynchronously.
            setIsLoading(false);
        }
    }, [results]);

    const saveHistory = (): void => {
        if (!drawingCanvasRef.current) return;
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (!ctx) return;
        const width = drawingCanvasRef.current.width;
        const height = drawingCanvasRef.current.height;
        const imageData = ctx.getImageData(0, 0, width, height);

        historyRef.current.push(imageData);
        if (historyRef.current.length > 10) {
            historyRef.current.shift();
        }
    };

    const undo = useCallback((): void => {
        if (viewMode === '3d') {
            setLines3D((prev: DrawingLine3D[]): DrawingLine3D[] => prev.slice(0, -1));
            return;
        }

        if (historyRef.current.length === 0 || !drawingCanvasRef.current) return;
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (!ctx) return;
        const previousState = historyRef.current.pop();
        if (previousState) {
            ctx.putImageData(previousState, 0, 0);
        }
    }, [viewMode]);

    const clearCanvas = (): void => {
        if (viewMode === '3d') {
            setLines3D([]);
            setActiveLine3D([]);
            return;
        }
        if (!drawingCanvasRef.current) return;
        saveHistory();
        const ctx = drawingCanvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, drawingCanvasRef.current.width, drawingCanvasRef.current.height);
    };

    const saveImage = useCallback((): void => {
        if (!drawingCanvasRef.current) return;

        // Create a temporary canvas to composite with background
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = drawingCanvasRef.current.width;
        tempCanvas.height = drawingCanvasRef.current.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = '#1a1a1a'; // Match app background
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Draw the drawing
        ctx.drawImage(drawingCanvasRef.current, 0, 0);

        // Download
        const link = document.createElement('a');
        link.download = `air-draw-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
    }, []);

    // Keyboard Shortcuts
    useEffect((): (() => void) => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                if (viewMode === '3d') handleExport3D();
                else saveImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return (): void => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [viewMode, handleExport3D, saveImage, undo]);

    // Main Loop
    useEffect((): void => {
        if (!canvasRef.current || !results || !drawingCanvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        const drawingCtx = drawingCanvasRef.current.getContext('2d');
        if (!ctx || !drawingCtx) return;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        ctx.save();
        ctx.clearRect(0, 0, width, height);

        // 1. Draw persistent drawing canvas
        ctx.drawImage(drawingCanvasRef.current, 0, 0, width, height);

        // 2. Draw Hand Skeleton (if enabled)
        if (showSkeleton) {
            drawHandSkeleton(ctx, results);
        }

        // 3. Handle Gestures
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const indexTip = landmarks[8];
            const thumbTip = landmarks[4];

            // Smoothing logic for drawing point
            smoothedPos.current.x = smoothedPos.current.x * (1 - smoothingAlpha) + indexTip.x * smoothingAlpha;
            smoothedPos.current.y = smoothedPos.current.y * (1 - smoothingAlpha) + indexTip.y * smoothingAlpha;
            smoothedPos.current.z = smoothedPos.current.z * (1 - smoothingAlpha) + indexTip.z * smoothingAlpha;

            const x = smoothedPos.current.x * width;
            const y = smoothedPos.current.y * height;

            // Calculate dynamic brush size
            let currentBrushSize = brushSize;
            if (activeTool === 'freehand' && isDynamicSize) {
                const wrist = landmarks[0];
                const middleMCP = landmarks[9];
                const handSize = Math.sqrt(Math.pow(wrist.x - middleMCP.x, 2) + Math.pow(wrist.y - middleMCP.y, 2));
                const minSize = 2, maxSize = 30, minHand = 0.05, maxHand = 0.25;
                const ratio = (handSize - minHand) / (maxHand - minHand);
                currentBrushSize = minSize + Math.max(0, Math.min(1, ratio)) * (maxSize - minSize);
            }

            // Pinch Detection
            const pinchDist = Math.sqrt(Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2));
            const isPinching = pinchDist < 0.08;

            // Gesture: Fist for Undo (Distance between all fingers and wrist is small)
            // Simplified: Distance between tip 8 and 12 and 16 and 20 to palm
            const isFist = [8, 12, 16, 20].every((tipIdx: number): boolean => {
                const tip = landmarks[tipIdx];
                const palm = landmarks[0];
                const dist = Math.sqrt(Math.pow(tip.x - palm.x, 2) + Math.pow(tip.y - palm.y, 2));
                return dist < 0.12;
            });

            if (isFist && Date.now() - gestureCooldown.current > 1000) {
                // eslint-disable-next-line react-hooks/set-state-in-effect -- Hand-tracking results trigger gesture actions.
                undo();
                gestureCooldown.current = Date.now();
            }

            if (isPinching) {
                if (!isDrawing) {
                    setIsDrawing(true);
                    setLastPoint({ x, y });
                    currentPathRef.current = [{ x, y }];

                    if (viewMode === '3d') {
                        const z = (1 - smoothedPos.current.z) * 10 - 5;
                        const x3d = (smoothedPos.current.x - 0.5) * 20;
                        const y3d = (0.5 - smoothedPos.current.y) * 20;
                        setActiveLine3D([{ x: x3d, y: y3d, z }]);
                    } else {
                        saveHistory();
                    }
                } else {
                    if (viewMode === '3d') {
                        const z = (1 - smoothedPos.current.z) * 10 - 5;
                        const x3d = (smoothedPos.current.x - 0.5) * 20;
                        const y3d = (0.5 - smoothedPos.current.y) * 20;
                        setActiveLine3D((prev: Point3D[]): Point3D[] => [...prev, { x: x3d, y: y3d, z }]);
                    } else {
                        if (activeTool === 'freehand') {
                            if (lastPoint) {
                                drawLine(drawingCtx, lastPoint, { x, y }, brushColor, currentBrushSize);
                            }
                        } else if (activeTool === 'shape') {
                            ctx.beginPath();
                            ctx.strokeStyle = brushColor;
                            ctx.lineWidth = brushSize;
                            if (currentPathRef.current.length > 0) {
                                const start = currentPathRef.current[0];
                                ctx.moveTo(start.x, start.y);
                                for (let i = 1; i < currentPathRef.current.length; i++) {
                                    ctx.lineTo(currentPathRef.current[i].x, currentPathRef.current[i].y);
                                }
                                ctx.stroke();
                            }
                        }
                    }

                    setLastPoint({ x, y });
                    currentPathRef.current.push({ x, y });
                }
            } else {
                if (isDrawing) {
                    setIsDrawing(false);
                    setLastPoint(null);

                    if (viewMode === '3d') {
                        setLines3D((prev: DrawingLine3D[]): DrawingLine3D[] => [...prev, { points: activeLine3D, color: brushColor, size: brushSize }]);
                        setActiveLine3D([]);
                    } else if (activeTool === 'shape') {
                        const shape = detectShape(currentPathRef.current);
                        if (shape) {
                            drawingCtx.beginPath();
                            drawingCtx.strokeStyle = brushColor;
                            drawingCtx.lineWidth = brushSize;
                            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                            for (const p of currentPathRef.current) {
                                if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
                                if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
                            }
                            const w = maxX - minX, h = maxY - minY;
                            const cx = minX + w / 2, cy = minY + h / 2;
                            if (shape === 'circle') drawingCtx.arc(cx, cy, Math.max(w, h) / 2, 0, 2 * Math.PI);
                            else if (shape === 'rectangle') drawingCtx.strokeRect(minX, minY, w, h);
                            else if (shape === 'line') {
                                drawingCtx.moveTo(currentPathRef.current[0].x, currentPathRef.current[0].y);
                                drawingCtx.lineTo(currentPathRef.current[currentPathRef.current.length - 1].x, currentPathRef.current[currentPathRef.current.length - 1].y);
                            }
                            drawingCtx.stroke();
                        }
                    }
                    currentPathRef.current = [];
                }
            }

            // Cursor visualization
            ctx.beginPath();
            ctx.arc(x, y, currentBrushSize / 2, 0, 2 * Math.PI);
            ctx.fillStyle = brushColor;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.stroke();
        }

        ctx.restore();
    }, [results, isDrawing, lastPoint, activeTool, brushColor, brushSize, isDynamicSize, showSkeleton, viewMode, activeLine3D, undo]);

    // Initialize canvas size
    useEffect((): (() => void) => {
        const resizeCanvas = (): void => {
            if (canvasRef.current && videoRef.current && drawingCanvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                drawingCanvasRef.current.width = window.innerWidth;
                drawingCanvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return (): void => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <div className="hand-canvas-container">
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Loading Hand Tracking Model...</p>
                </div>
            )}

            <video
                ref={videoRef}
                className="video-feed"
                style={{ display: 'none' }}
            />

            <canvas
                ref={drawingCanvasRef}
                className="drawing-canvas hidden"
            />

            <canvas
                ref={canvasRef}
                className="main-canvas"
            />

            <ControlPanel
                activeTool={activeTool}
                setActiveTool={setActiveTool}
                brushColor={brushColor}
                setBrushColor={setBrushColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                isDynamicSize={isDynamicSize}
                setIsDynamicSize={setIsDynamicSize}
                showSkeleton={showSkeleton}
                setShowSkeleton={setShowSkeleton}
                clearCanvas={clearCanvas}
                undo={undo}
                saveImage={saveImage}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isNeon={isNeon}
                setIsNeon={setIsNeon}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                autoRotate={autoRotate}
                setAutoRotate={setAutoRotate}
                export3D={handleExport3D}
            />

            {viewMode === '3d' && (
                <Scene3D
                    ref={scene3DRef}
                    lines={lines3D}
                    activeLine={activeLine3D}
                    brushColor={brushColor}
                    brushSize={brushSize}
                    isNeon={isNeon}
                    showGrid={showGrid}
                    autoRotate={autoRotate}
                />
            )}
        </div>
    );
};

export default HandCanvas;
