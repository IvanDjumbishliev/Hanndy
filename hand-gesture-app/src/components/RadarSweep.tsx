import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import styles from './RadarSweep.module.css';

interface RadarSweepProps {
  hands: Array<{ wristX: number; wristY: number }>;
}

const TWO_PI = Math.PI * 2;
const SWEEP_ANGLE = Math.PI / 2;

const RadarSweep = ({ hands }: RadarSweepProps): ReactElement => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handsRef = useRef(hands);
  const rotationRef = useRef<number>(0);

  useEffect((): void => {
    handsRef.current = hands;
  }, [hands]);

  useEffect((): (() => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return (): void => {};

    const resizeCanvas = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return (): void => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect((): (() => void) | void => {
    if (hands.length === 0) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    let frameId = 0;
    let previousTime: number | null = null;
    const drawFrame = (time: number): void => {
      const deltaTime = previousTime === null ? 0 : time - previousTime;
      previousTime = time;
      rotationRef.current = (rotationRef.current + (deltaTime / 2000) * TWO_PI) % TWO_PI;

      context.clearRect(0, 0, canvas.width, canvas.height);
      const pulseAlpha = 0.7 + 0.3 * Math.sin(Date.now() / 300);
      for (const { wristX, wristY } of handsRef.current) {
        drawRadar(context, wristX, wristY, rotationRef.current, pulseAlpha);
      }

      frameId = window.requestAnimationFrame(drawFrame);
    };

    frameId = window.requestAnimationFrame(drawFrame);
    return (): void => window.cancelAnimationFrame(frameId);
  }, [hands.length]);

  return (
    <canvas
      ref={canvasRef}
      className={`${styles.radar} ${hands.length > 0 ? styles.active : ''}`}
      aria-hidden="true"
    />
  );
};

const drawRadar = (
  context: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  rotation: number,
  pulseAlpha: number,
): void => {
  context.save();

  context.beginPath();
  context.arc(centerX, centerY, 80, 0, TWO_PI);
  context.strokeStyle = 'rgba(0, 245, 255, 0.4)';
  context.lineWidth = 1;
  context.stroke();

  context.beginPath();
  context.arc(centerX, centerY, 40, 0, TWO_PI);
  context.strokeStyle = 'rgba(0, 245, 255, 0.2)';
  context.stroke();

  context.beginPath();
  context.setLineDash([4, 4]);
  context.strokeStyle = 'rgba(0, 245, 255, 0.3)';
  context.moveTo(centerX, centerY - 100);
  context.lineTo(centerX, centerY);
  context.moveTo(centerX, centerY);
  context.lineTo(centerX, centerY + 100);
  context.moveTo(centerX - 100, centerY);
  context.lineTo(centerX, centerY);
  context.moveTo(centerX, centerY);
  context.lineTo(centerX + 100, centerY);
  context.stroke();
  context.setLineDash([]);

  const sweepGradient = context.createConicGradient(rotation, centerX, centerY);
  sweepGradient.addColorStop(0, 'rgba(0, 245, 255, 0.5)');
  sweepGradient.addColorStop(0.25, 'rgba(0, 245, 255, 0)');
  sweepGradient.addColorStop(1, 'rgba(0, 245, 255, 0)');
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.arc(centerX, centerY, 80, rotation, rotation + SWEEP_ANGLE);
  context.closePath();
  context.fillStyle = sweepGradient;
  context.fill();

  context.beginPath();
  context.globalAlpha = pulseAlpha;
  context.arc(centerX, centerY, 4, 0, TWO_PI);
  context.fillStyle = 'rgba(0, 245, 255, 1)';
  context.fill();

  context.restore();
};

export default RadarSweep;
