import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { GestureName, GestureResult } from './types/gestures';
import { useAirDrawing } from './hooks/useAirDrawing';
import useHandGesture from './hooks/useHandGesture';
import WebcamFeed from './components/WebcamFeed';
import LandmarkOverlay from './components/LandmarkOverlay';
import GestureDisplay from './components/GestureDisplay';
import GestureHistory from './components/GestureHistory';
import type { HistoryEntry } from './components/GestureHistory';
import GestureDemo from './components/GestureDemo';
import SplashScreen from './components/SplashScreen';
import { GESTURE_EMOJI } from './gestures/emojiMap';
import PerformanceStats from './components/PerformanceStats';
import ControlPanel from './components/ControlPanel';
import Scene3D from './components/Scene3D';
import type { Scene3DHandle } from './components/Scene3D';
import type { DrawingTool, DrawingViewMode } from './hooks/useAirDrawing';
import './App.css';
import './styles/DrawingSurface.css';

type Theme = 'dark' | 'light';

const getInitialTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark';
  try {
    const savedTheme = window.localStorage.getItem('hanndy-theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme;
  } catch {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App(): ReactElement {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [isSplashVisible, setIsSplashVisible] = useState<boolean>(true);
  const isThemeChangeUserInitiatedRef = useRef<boolean>(false);
  const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scene3DRef = useRef<Scene3DHandle | null>(null);
  const previousGestureRef = useRef<Partial<Record<'Left' | 'Right', GestureName | null>>>({});
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
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

  useLayoutEffect((): void => {
    document.documentElement.dataset.theme = theme;
    if (isThemeChangeUserInitiatedRef.current) {
      window.localStorage.setItem('hanndy-theme', theme);
      isThemeChangeUserInitiatedRef.current = false;
    }
  }, [theme]);

  const { hands, fps, inferenceMs, isLoading, error, results } = useHandGesture(videoRef, isStarted);
  useEffect((): (() => void) | void => {
    if (!isStarted) return;
    const timeoutId = window.setTimeout((): void => setIsSplashVisible(false), 300);
    return (): void => window.clearTimeout(timeoutId);
  }, [isStarted]);
  useEffect((): void => {
    const detectedHandedness = new Set(hands.map((hand) => hand.handedness));
    for (const handedness of ['Left', 'Right'] as const) {
      if (!detectedHandedness.has(handedness)) previousGestureRef.current[handedness] = null;
    }
    const newEntries: HistoryEntry[] = [];
    for (const { gesture, handedness } of hands) {
      if (previousGestureRef.current[handedness] !== gesture.gestureName) {
        newEntries.push({
          id: crypto.randomUUID(),
          gestureName: gesture.gestureName,
          handedness,
          emoji: GESTURE_EMOJI[gesture.gestureName],
          timestamp: Date.now(),
        });
      }
      previousGestureRef.current[handedness] = gesture.gestureName;
    }
    if (newEntries.length > 0) {
      queueMicrotask((): void => {
        setHistoryLog((previous: HistoryEntry[]): HistoryEntry[] =>
          [...previous, ...newEntries].slice(-20));
      });
    }
  }, [hands]);

  const overlayHands = results?.multiHandLandmarks.flatMap((landmarks, index) => {
    const handedness = results.multiHandedness[index]?.label;
    return handedness === 'Left' || handedness === 'Right' ? [{ landmarks, handedness }] : [];
  }) ?? [];

  const drawing = useAirDrawing({
    drawingCanvasRef, activeTool, brushColor, brushSize, isDynamicSize, viewMode,
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
    <div className="App hand-canvas-container" data-theme={theme}>
      <div className={`app-view${isStarted ? ' app-view--visible' : ''}`}>
        {isStarted && <WebcamFeed videoRef={videoRef} />}
        {isStarted && (
          <LandmarkOverlay
            hands={overlayHands}
            results={results}
            drawingCanvasRef={drawingCanvasRef}
            showSkeleton={showSkeleton} renderFrame={renderFrame} />
        )}
        {isStarted && (isLoading || error) && (
          <div className="loading-overlay">
            {error ? <p className="camera-error">{error}</p> : <><div className="spinner" /><p>Loading Hand Tracking Model...</p></>}
          </div>
        )}
        {isStarted && (
          <>
            <GestureDisplay hands={hands} />
            <GestureDemo hands={hands} />
            {showHistory && <GestureHistory entries={historyLog} onClear={(): void => setHistoryLog([])} />}
            {showStats && <PerformanceStats fps={fps} inferenceTime={inferenceMs} />}
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
          </>
        )}
      </div>
      {isSplashVisible && (
        <SplashScreen
          isLoading={isStarted && isLoading}
          isFadingOut={isStarted}
          onStart={(): void => setIsStarted(true)}
        />
      )}
      <button
        className="theme-toggle"
        type="button"
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        onClick={(): void => {
          isThemeChangeUserInitiatedRef.current = true;
          setTheme((current: Theme): Theme => current === 'dark' ? 'light' : 'dark');
        }}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>
    </div>
  );
}

export default App;
