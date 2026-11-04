import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import type { HandTrackingResults, PerformanceMeasurement } from '../types/tracking';
import '@mediapipe/camera_utils';
import '@mediapipe/hands';

interface WebcamFeedProps {
  onResults: (results: HandTrackingResults) => void;
  onPerformance: (measurement: PerformanceMeasurement) => void;
  onError: (message: string) => void;
}

const WebcamFeed = ({ onResults, onPerformance, onError }: WebcamFeedProps): ReactElement => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect((): (() => void) | void => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let lastReportTime = performance.now();
    let frameCount = 0;
    let latestInferenceTime = 0;
    const hands = new window.Hands({
      locateFile: (file: string): string => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    hands.onResults((results: HandTrackingResults): void => {
      if (active) onResults(results);
    });

    const camera = new window.Camera(video, {
      onFrame: async (): Promise<void> => {
        if (!active) return;
        const now = performance.now();
        frameCount += 1;
        const inferenceStart = now;
        try {
          await hands.send({ image: video });
        } catch (error) {
          if (active) onError(error instanceof Error ? error.message : String(error));
          return;
        }
        latestInferenceTime = performance.now() - inferenceStart;
        if (now - lastReportTime >= 500) {
          onPerformance({
            fps: frameCount * 1000 / (now - lastReportTime),
            inferenceTime: latestInferenceTime,
          });
          frameCount = 0;
          lastReportTime = now;
        }
      },
      width: 1280,
      height: 720,
    });

    void camera.start().catch((error: unknown): void => {
      if (active) onError(error instanceof Error ? error.message : String(error));
    });

    return (): void => {
      active = false;
      void camera.stop();
      void hands.close();
      const stream = video.srcObject;
      if (stream instanceof MediaStream) stream.getTracks().forEach((track: MediaStreamTrack): void => track.stop());
    };
  }, [onError, onPerformance, onResults]);

  return <video ref={videoRef} className="video-feed" style={{ display: 'none' }} />;
};

export default WebcamFeed;
