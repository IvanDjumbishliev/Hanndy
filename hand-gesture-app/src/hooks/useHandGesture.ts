import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { GestureName, GestureResult, HandLandmark } from '../types/gestures';
import type { HandTrackingResults } from '../types/tracking';
import { recognizeGesture } from '../gestures/recognizer';
import '@mediapipe/hands';

const SMOOTHING_WINDOW = 5;
const DEBOUNCE_FRAMES = 5;

export interface UseHandGestureResult {
  gesture: GestureResult | null;
  fps: number;
  inferenceMs: number;
  isLoading: boolean;
  error: string | null;
  results: HandTrackingResults | null;
}

function useHandGesture(videoRef: RefObject<HTMLVideoElement | null>): UseHandGestureResult {
  const [gesture, setGesture] = useState<GestureResult | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [inferenceMs, setInferenceMs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<HandTrackingResults | null>(null);
  const landmarkBufferRef = useRef<HandLandmark[][]>([]);
  const candidateGestureRef = useRef<GestureName | null>(null);
  const candidateCountRef = useRef<number>(0);

  useEffect((): (() => void) => {
    let active = true;
    let landmarkBufferIndex = 0;
    landmarkBufferRef.current = [];
    candidateGestureRef.current = null;
    candidateCountRef.current = 0;
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
    const advanceCandidate = (gestureName: GestureName | null): number => {
      if (candidateGestureRef.current === gestureName) {
        candidateCountRef.current += 1;
      } else {
        candidateGestureRef.current = gestureName;
        candidateCountRef.current = 1;
      }
      return candidateCountRef.current;
    };

    hands.onResults((frame: HandTrackingResults): void => {
      if (!active) return;
      const rawLandmarks = frame.multiHandLandmarks[0];
      const label = frame.multiHandedness[0]?.label;
      if (!rawLandmarks) {
        landmarkBufferRef.current = [];
        landmarkBufferIndex = 0;
        const candidateCount = advanceCandidate(null);
        setResults(frame);
        if (candidateCount >= DEBOUNCE_FRAMES) setGesture(null);
        return;
      }

      const landmarkBuffer = landmarkBufferRef.current;
      landmarkBuffer[landmarkBufferIndex] = rawLandmarks;
      landmarkBufferIndex = (landmarkBufferIndex + 1) % SMOOTHING_WINDOW;
      const landmarks: HandLandmark[] = rawLandmarks.map((landmark, landmarkIndex): HandLandmark => {
        const samples = landmarkBuffer
          .map((sample: HandLandmark[]): HandLandmark | undefined => sample[landmarkIndex])
          .filter((sample): sample is HandLandmark => sample !== undefined);
        const sampleCount = samples.length;
        return {
          x: samples.reduce((sum: number, sample: HandLandmark): number => sum + sample.x, 0) / sampleCount,
          y: samples.reduce((sum: number, sample: HandLandmark): number => sum + sample.y, 0) / sampleCount,
          z: samples.reduce((sum: number, sample: HandLandmark): number => sum + sample.z, 0) / sampleCount,
        };
      });
      setResults({
        ...frame,
        multiHandLandmarks: frame.multiHandLandmarks.map(
          (handLandmarks, index) => index === 0 ? landmarks : handLandmarks,
        ),
      });

      if (label !== 'Left' && label !== 'Right') {
        landmarkBufferRef.current = [];
        landmarkBufferIndex = 0;
        const candidateCount = advanceCandidate(null);
        if (candidateCount >= DEBOUNCE_FRAMES) setGesture(null);
        return;
      }

      const { name: gestureName, confidence } = recognizeGesture(landmarks);
      if (advanceCandidate(gestureName) >= DEBOUNCE_FRAMES) {
        setGesture({ gestureName, confidence, handedness: label, landmarks });
      }
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
