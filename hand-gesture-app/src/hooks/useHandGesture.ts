import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { GestureName, GestureResult, HandLandmark } from '../types/gestures';
import type { HandTrackingResults } from '../types/tracking';
import { recognizeGesture } from '../gestures/recognizer';
import '@mediapipe/hands';

const SMOOTHING_WINDOW = 5;
const DEBOUNCE_FRAMES = 5;

type Handedness = 'Left' | 'Right';

interface DetectedHand {
  gesture: GestureResult;
  handedness: Handedness;
}

interface LandmarkBuffer {
  landmarks: HandLandmark[][];
  nextIndex: number;
}

interface GestureCandidate {
  name: GestureName | null;
  count: number;
}

export interface UseHandGestureResult {
  hands: DetectedHand[];
  fps: number;
  inferenceMs: number;
  handsDetected: number;
  isSmoothing: boolean;
  isLoading: boolean;
  error: string | null;
  results: HandTrackingResults | null;
}

function useHandGesture(
  videoRef: RefObject<HTMLVideoElement | null>,
  enabled = true,
): UseHandGestureResult {
  const [detectedHands, setDetectedHands] = useState<DetectedHand[]>([]);
  const [fps, setFps] = useState<number>(0);
  const [inferenceMs, setInferenceMs] = useState<number>(0);
  const [handsDetected, setHandsDetected] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HandTrackingResults | null>(null);
  const landmarkBuffersRef = useRef<Partial<Record<Handedness, LandmarkBuffer>>>({});
  const gestureCandidatesRef = useRef<Partial<Record<Handedness, GestureCandidate>>>({});
  const confirmedHandsRef = useRef<Partial<Record<Handedness, DetectedHand>>>({});

  useEffect((): (() => void) => {
    let active = true;
    if (!enabled) return (): void => { active = false; };

    landmarkBuffersRef.current = {};
    gestureCandidatesRef.current = {};
    confirmedHandsRef.current = {};
    const video = videoRef.current;
    if (!video) {
      queueMicrotask((): void => {
        if (active) {
          setError('The webcam video element is unavailable.');
          setIsLoading(false);
        }
      });
      return (): void => { active = false; };
    }

    let animationFrameId: number | null = null;
    let stream: MediaStream | null = null;
    const inferenceTimes: number[] = [];
    const handsModel = new window.Hands({
      locateFile: (file: string): string => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsModel.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    const advanceCandidate = (handedness: Handedness, gestureName: GestureName | null): number => {
      const previous = gestureCandidatesRef.current[handedness];
      if (previous?.name === gestureName) {
        previous.count += 1;
      } else {
        gestureCandidatesRef.current[handedness] = { name: gestureName, count: 1 };
      }
      return gestureCandidatesRef.current[handedness]?.count ?? 0;
    };

    const smoothLandmarks = (handedness: Handedness, rawLandmarks: HandLandmark[]): HandLandmark[] => {
      let buffer = landmarkBuffersRef.current[handedness];
      if (!buffer) {
        buffer = { landmarks: [], nextIndex: 0 };
        landmarkBuffersRef.current[handedness] = buffer;
      }
      buffer.landmarks[buffer.nextIndex] = rawLandmarks;
      buffer.nextIndex = (buffer.nextIndex + 1) % SMOOTHING_WINDOW;
      return rawLandmarks.map((landmark, landmarkIndex): HandLandmark => {
        const samples = buffer.landmarks
          .map((sample: HandLandmark[]): HandLandmark | undefined => sample[landmarkIndex])
          .filter((sample): sample is HandLandmark => sample !== undefined);
        const sampleCount = samples.length;
        return {
          x: samples.reduce((sum: number, sample: HandLandmark): number => sum + sample.x, 0) / sampleCount,
          y: samples.reduce((sum: number, sample: HandLandmark): number => sum + sample.y, 0) / sampleCount,
          z: samples.reduce((sum: number, sample: HandLandmark): number => sum + sample.z, 0) / sampleCount,
        };
      });
    };

    handsModel.onResults((frame: HandTrackingResults): void => {
      if (!active) return;
      const smoothedLandmarks = frame.multiHandLandmarks.map((rawLandmarks, index) => {
        const label = frame.multiHandedness[index]?.label;
        return label === 'Left' || label === 'Right'
          ? smoothLandmarks(label, rawLandmarks)
          : rawLandmarks;
      });
      setResults({
        ...frame,
        multiHandLandmarks: smoothedLandmarks,
      });

      const visibleHands = new Set<Handedness>();
      for (const [index, landmarks] of smoothedLandmarks.entries()) {
        const handedness = frame.multiHandedness[index]?.label;
        if (handedness !== 'Left' && handedness !== 'Right') continue;
        visibleHands.add(handedness);
        const { name: gestureName, confidence } = recognizeGesture(landmarks);
        if (advanceCandidate(handedness, gestureName) >= DEBOUNCE_FRAMES) {
          const gesture: GestureResult = { gestureName, confidence, handedness, landmarks };
          confirmedHandsRef.current[handedness] = { gesture, handedness };
        }
      }

      setHandsDetected(visibleHands.size);
      for (const handedness of ['Left', 'Right'] as const) {
        if (visibleHands.has(handedness)) continue;
        delete landmarkBuffersRef.current[handedness];
        if (advanceCandidate(handedness, null) >= DEBOUNCE_FRAMES) {
          delete confirmedHandsRef.current[handedness];
        }
      }

      setDetectedHands(
        (['Left', 'Right'] as const)
          .map((handedness) => confirmedHandsRef.current[handedness])
          .filter((hand): hand is DetectedHand => hand !== undefined),
      );
    });

    const loadCamera = async (): Promise<MediaStream> => {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (cameraError: unknown) {
        if (
          cameraError instanceof DOMException
          && (cameraError.name === 'NotAllowedError' || cameraError.name === 'PermissionDeniedError')
        ) {
          throw new Error('Camera access was denied. Please allow camera access and try again.');
        }
        throw new Error(
          `Unable to access the camera: ${cameraError instanceof Error ? cameraError.message : String(cameraError)}`,
        );
      }
    };

    const processFrame = async (): Promise<void> => {
      if (!active) return;
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const start = performance.now();
        try {
          await handsModel.send({ image: video });
        } catch (inferenceError: unknown) {
          if (active) {
            setError(
              `Hand tracking failed: ${inferenceError instanceof Error ? inferenceError.message : String(inferenceError)}`,
            );
          }
          return;
        }
        const end = performance.now();
        setInferenceMs(end - start);
        inferenceTimes.push(end);
      }
      const now = performance.now();
      while (inferenceTimes[0] !== undefined && inferenceTimes[0] < now - 1000) inferenceTimes.shift();
      setFps(inferenceTimes.length);
      if (active) animationFrameId = window.requestAnimationFrame((): void => { void processFrame(); });
    };

    const start = async (): Promise<void> => {
      const modelPromise = handsModel.initialize().then((): boolean => {
        if (active) setIsLoading(false);
        return true;
      }).catch((modelError: unknown): boolean => {
        if (active) {
          setError(
            `Unable to load the hand tracking model: ${modelError instanceof Error ? modelError.message : String(modelError)}`,
          );
          setIsLoading(false);
        }
        return false;
      });
      const cameraPromise = loadCamera().catch((cameraError: unknown): null => {
        if (active) setError(cameraError instanceof Error ? cameraError.message : String(cameraError));
        return null;
      });
      const [modelLoaded, cameraStream] = await Promise.all([modelPromise, cameraPromise]);
      if (!active) {
        cameraStream?.getTracks().forEach((track: MediaStreamTrack): void => track.stop());
        return;
      }
      if (!modelLoaded || !cameraStream) {
        cameraStream?.getTracks().forEach((track: MediaStreamTrack): void => track.stop());
        return;
      }

      stream = cameraStream;
      video.srcObject = stream;
      try {
        await video.play();
      } catch (playError: unknown) {
        if (active) {
          setError(
            `Unable to start the camera video: ${playError instanceof Error ? playError.message : String(playError)}`,
          );
        }
        return;
      }
      if (active) animationFrameId = window.requestAnimationFrame((): void => { void processFrame(); });
    };

    void start();

    return (): void => {
      active = false;
      if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
      stream?.getTracks().forEach((track: MediaStreamTrack): void => track.stop());
      video.srcObject = null;
      void handsModel.close();
    };
  }, [enabled, videoRef]);

  return {
    hands: detectedHands,
    fps,
    inferenceMs,
    handsDetected,
    isSmoothing: SMOOTHING_WINDOW > 1,
    isLoading,
    error,
    results,
  };
}

export default useHandGesture;
