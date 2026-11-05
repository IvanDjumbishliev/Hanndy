import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import type { GestureResult } from '../types/gestures';
import type { HandTrackingResults } from '../types/tracking';
import '@mediapipe/hands';

export interface UseHandGestureResult {
  gesture: GestureResult | null;
  fps: number;
  inferenceMs: number;
  isLoading: boolean;
  error: string | null;
  results: HandTrackingResults | null;
}

const pointDistance = (
  first: HandTrackingResults['multiHandLandmarks'][number][number],
  second: HandTrackingResults['multiHandLandmarks'][number][number],
): number => Math.hypot(first.x - second.x, first.y - second.y);

function useHandGesture(videoRef: RefObject<HTMLVideoElement | null>): UseHandGestureResult {
  const [gesture, setGesture] = useState<GestureResult | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [inferenceMs, setInferenceMs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HandTrackingResults | null>(null);

  useEffect((): (() => void) => {
    let active = true;
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
    const hands = new window.Hands({
      locateFile: (file: string): string => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults((frame: HandTrackingResults): void => {
      if (!active) return;
      setResults(frame);

      const landmarks = frame.multiHandLandmarks[0];
      const label = frame.multiHandedness[0]?.label;
      if (!landmarks || (label !== 'Left' && label !== 'Right')) {
        setGesture(null);
        return;
      }

      const isPinching = pointDistance(landmarks[8], landmarks[4]) < 0.08;
      const isFist = [8, 12, 16, 20].every((tipIndex: number): boolean =>
        pointDistance(landmarks[tipIndex], landmarks[0]) < 0.12);
      const gestureName = isPinching ? 'Pinch' : isFist ? 'Fist' : null;
      if (!gestureName) {
        setGesture(null);
        return;
      }

      const confidence = isPinching
        ? Math.max(0, Math.min(1, 1 - pointDistance(landmarks[8], landmarks[4]) / 0.08))
        : Math.max(0, Math.min(1, 1 - [8, 12, 16, 20].reduce(
          (sum: number, tipIndex: number): number =>
            sum + pointDistance(landmarks[tipIndex], landmarks[0]),
          0,
        ) / 4 / 0.12));
      setGesture({ gestureName, confidence, handedness: label, landmarks });
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
          await hands.send({ image: video });
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
      const modelPromise = hands.initialize().then((): boolean => {
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
      void hands.close();
    };
  }, [videoRef]);

  return { gesture, fps, inferenceMs, isLoading, error, results };
}

export default useHandGesture;
