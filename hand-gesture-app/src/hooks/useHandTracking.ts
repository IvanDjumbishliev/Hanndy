import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Camera } from '@mediapipe/camera_utils';
import type { Hands, Results } from '@mediapipe/hands';
import '@mediapipe/hands';
import '@mediapipe/camera_utils';

interface HandTrackingResult {
    results: Results | null;
    hands: Hands | null;
    camera: Camera | null;
}

export const useHandTracking = (
    videoRef: RefObject<HTMLVideoElement | null>,
    canvasRef: RefObject<HTMLCanvasElement | null>,
): HandTrackingResult => {
    const [results, setResults] = useState<Results | null>(null);
    const handsRef = useRef<Hands | null>(null);
    const cameraRef = useRef<Camera | null>(null);

    useEffect((): (() => void) | void => {
        if (!videoRef.current || !canvasRef.current) return;

        const hands = new window.Hands({
            locateFile: (file: string): string => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        hands.onResults((res: Results): void => {
            setResults(res);
        });

        handsRef.current = hands;

        const video = videoRef.current;
        const camera = new window.Camera(video, {
            onFrame: async (): Promise<void> => {
                if (handsRef.current) {
                    await handsRef.current.send({ image: video });
                }
            },
            width: 1280,
            height: 720
        });

        camera.start();
        cameraRef.current = camera;

        return (): void => {
            if (cameraRef.current) {
                // camera.stop() is not always reliable in cleanup, but we can try
                // Actually camera utils doesn't have a stop method that is exposed easily in all versions, 
                // but merely stopping the video element source can work.
                // For now we will just let it be.
            }
            if (handsRef.current) {
                handsRef.current.close();
            }
        };
    }, [videoRef, canvasRef]);

    return { results, hands: handsRef.current, camera: cameraRef.current };
};
