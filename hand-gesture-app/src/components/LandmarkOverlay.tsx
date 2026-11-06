import { useEffect, useRef } from 'react';
import type { ReactElement, RefObject } from 'react';
import type { HandLandmark } from '../types/gestures';
import type { FrameRenderer, HandTrackingResults } from '../types/tracking';
import useParticleTrail from '../hooks/useParticleTrail';
import type { Particle } from '../hooks/useParticleTrail';

interface LandmarkOverlayProps {
  hands: Array<{ landmarks: HandLandmark[]; handedness: 'Left' | 'Right' }>;
  results?: HandTrackingResults | null;
  drawingCanvasRef?: RefObject<HTMLCanvasElement | null>;
  showSkeleton?: boolean;
  renderFrame?: FrameRenderer;
}

const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];

const FINGERTIP_INDICES = new Set<number>([4, 8, 12, 16, 20]);

const LandmarkOverlay = ({
  hands,
  results,
  drawingCanvasRef,
  showSkeleton = true,
  renderFrame,
}: LandmarkOverlayProps): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { particles, addParticle, tickParticles } = useParticleTrail();

  useEffect((): (() => void) => {
    const resizeCanvas = (): void => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (canvasRef.current) {
        canvasRef.current.width = width;
        canvasRef.current.height = height;
      }
      if (drawingCanvasRef?.current) {
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
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    tickParticles();
    for (const hand of hands) {
      const color = getHandColor(hand.handedness);
      const indexTip = hand.landmarks[8];
      const thumbTip = hand.landmarks[4];
      if (indexTip) {
        addParticle(indexTip.x * canvas.width, indexTip.y * canvas.height, color);
      }
      if (thumbTip) {
        addParticle(thumbTip.x * canvas.width, thumbTip.y * canvas.height, color, 0.5, 3);
      }
    }

    const drawParticles = (): void => {
      for (const particle of particles.current) drawParticle(context, particle);
    };
    const drawSkeleton = (): void => {
      if (!showSkeleton) return;
      for (const hand of hands) {
        if (hand.landmarks.length >= 21) {
          drawSciFiHand(context, hand.landmarks, hand.handedness, canvas.width, canvas.height);
        }
      }
    };
    if (results && drawingCanvasRef?.current && renderFrame) {
      renderFrame(context, results, (): void => {
        drawParticles();
        drawSkeleton();
      });
    } else {
      context.clearRect(0, 0, canvas.width, canvas.height);
      drawParticles();
      drawSkeleton();
    }
  }, [addParticle, drawingCanvasRef, hands, particles, renderFrame, results, showSkeleton, tickParticles]);

  return (
    <>
      <canvas ref={drawingCanvasRef} className="drawing-canvas" hidden />
      <canvas ref={canvasRef} className="main-canvas" />
    </>
  );
};

const getHandColor = (handedness: 'Left' | 'Right'): string =>
  handedness === 'Left' ? '#00f5ff' : '#ff00e5';

const drawParticle = (context: CanvasRenderingContext2D, particle: Particle): void => {
  context.save();
  context.globalAlpha = particle.alpha;
  context.shadowBlur = 12;
  context.shadowColor = particle.color;
  context.fillStyle = particle.color;
  context.beginPath();
  context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
};

const drawSciFiHand = (
  context: CanvasRenderingContext2D,
  landmarks: HandLandmark[],
  handedness: 'Left' | 'Right',
  width: number,
  height: number,
): void => {
  const color = getHandColor(handedness);
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.shadowColor = color;
  context.shadowBlur = 12;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  for (const [startIndex, endIndex] of HAND_CONNECTIONS) {
    const start = landmarks[startIndex];
    const end = landmarks[endIndex];
    if (!start || !end) continue;
    context.beginPath();
    context.moveTo(start.x * width, start.y * height);
    context.lineTo(end.x * width, end.y * height);
    context.stroke();
  }

  context.shadowBlur = 0;
  for (const [index, landmark] of landmarks.entries()) {
    const radius = FINGERTIP_INDICES.has(index) ? 6 : 4;
    context.beginPath();
    context.arc(landmark.x * width, landmark.y * height, radius, 0, Math.PI * 2);
    context.fillStyle = FINGERTIP_INDICES.has(index) ? '#ffffff' : color;
    context.fill();
  }

  const wrist = landmarks[0];
  if (wrist) {
    context.font = '14px monospace';
    context.fillStyle = '#ffffff';
    context.fillText(handedness === 'Left' ? 'L' : 'R', wrist.x * width + 8, wrist.y * height - 8);
  }
  context.restore();
};

export default LandmarkOverlay;
