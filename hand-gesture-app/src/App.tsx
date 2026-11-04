import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { GestureResult } from './types/gestures';
import type { GestureHistoryItem, HandTrackingResults, PerformanceMeasurement } from './types/tracking';
import { useAirDrawing } from './hooks/useAirDrawing';
import WebcamFeed from './components/WebcamFeed';
import LandmarkOverlay from './components/LandmarkOverlay';
import GestureDisplay from './components/GestureDisplay';
import GestureHistory from './components/GestureHistory';
import PerformanceStats from './components/PerformanceStats';
import ControlPanel from './components/ControlPanel';
import Scene3D from './components/Scene3D';
import type { Scene3DHandle } from './components/Scene3D';
import type { DrawingTool, DrawingViewMode } from './hooks/useAirDrawing';
import './App.css';
import './styles/DrawingSurface.css';

function App(): ReactElement {
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scene3DRef = useRef<Scene3DHandle | null>(null);
  const previousGestureRef = useRef<GestureResult | null>(null);
  const nextGestureId = useRef<number>(0);
  const [results, setResults] = useState<HandTrackingResults | null>(null);
  const [gesture, setGesture] = useState<GestureResult | null>(null);
  const [history, setHistory] = useState<GestureHistoryItem[]>([]);
  const [performance, setPerformance] = useState<PerformanceMeasurement>({ fps: 0, inferenceTime: 0 });
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>('freehand');
  const [brushColor, setBrushColor] = useState<string>('#00FF00');
  const [brushSize, setBrushSize] = useState<number>(5);
  const [isDynamicSize, setIsDynamicSize] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<DrawingViewMode>('2d');
  const [isNeon, setIsNeon] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [showStats, setShowStats] = useState<boolean>(false);

  const onResults = useCallback((frame: HandTrackingResults): void => setResults(frame), []);
  const onPerformance = useCallback((measurement: PerformanceMeasurement): void => setPerformance(measurement), []);
  const onError = useCallback((message: string): void => {
    console.error('Hand tracking failed:', message);
    setCameraError(message);
  }, []);
  const onGestureChange = useCallback((detected: GestureResult | null): void => {
    setGesture(detected);
    if (detected && previousGestureRef.current?.gestureName !== detected.gestureName) {
      const item: GestureHistoryItem = { id: nextGestureId.current++, gesture: detected, detectedAt: Date.now() };
      setHistory((previous: GestureHistoryItem[]): GestureHistoryItem[] => [...previous, item].slice(-10));
    }
    previousGestureRef.current = detected;
  }, []);

  const drawing = useAirDrawing({
    drawingCanvasRef, activeTool, brushColor, brushSize, isDynamicSize, viewMode, onGestureChange,
  });
  const export3D = useCallback((): void => scene3DRef.current?.exportScene(), []);
  const { undo, clearCanvas, saveImage, renderFrame, lines3D, activeLine3D } = drawing;
  useEffect((): (() => void) => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.key === 'z') {
        event.preventDefault();
        undo();
      } else if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (viewMode === '3d') export3D();
        else saveImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [export3D, saveImage, undo, viewMode]);

  return (
    <div className="App hand-canvas-container">
      <WebcamFeed onResults={onResults} onPerformance={onPerformance} onError={onError} />
      <LandmarkOverlay results={results} drawingCanvasRef={drawingCanvasRef}
        showSkeleton={showSkeleton} renderFrame={renderFrame} />
      {results === null && (
        <div className="loading-overlay">
          {cameraError ? <p className="camera-error">{cameraError}</p> : <><div className="spinner" /><p>Loading Hand Tracking Model...</p></>}
        </div>
      )}
      <GestureDisplay gesture={gesture} />
      {showHistory && <GestureHistory items={history} />}
      {showStats && <PerformanceStats {...performance} />}
      <ControlPanel
        activeTool={activeTool} setActiveTool={setActiveTool}
        brushColor={brushColor} setBrushColor={setBrushColor}
        brushSize={brushSize} setBrushSize={setBrushSize}
        isDynamicSize={isDynamicSize} setIsDynamicSize={setIsDynamicSize}
        viewMode={viewMode} setViewMode={setViewMode}
        showSkeleton={showSkeleton} setShowSkeleton={setShowSkeleton}
        isNeon={isNeon} setIsNeon={setIsNeon} showGrid={showGrid} setShowGrid={setShowGrid}
        autoRotate={autoRotate} setAutoRotate={setAutoRotate}
        showHistory={showHistory} setShowHistory={setShowHistory}
        showStats={showStats} setShowStats={setShowStats}
        undo={undo} clearCanvas={clearCanvas} saveImage={saveImage} export3D={export3D}
      />
      {viewMode === '3d' && <Scene3D ref={scene3DRef} lines={lines3D}
        activeLine={activeLine3D} brushColor={brushColor} brushSize={brushSize}
        isNeon={isNeon} showGrid={showGrid} autoRotate={autoRotate} />}
    </div>
  );
}

export default App;
