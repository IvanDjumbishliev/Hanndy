import { useCallback, useRef } from 'react';
import type { MutableRefObject } from 'react';

export interface Particle {
  x: number;
  y: number;
  alpha: number;
  radius: number;
  color: string;
}

interface ParticleTrail {
  particles: MutableRefObject<Particle[]>;
  addParticle: (x: number, y: number, color: string, alpha?: number, radius?: number) => void;
  tickParticles: () => void;
}

const MAX_PARTICLES = 80;

const useParticleTrail = (): ParticleTrail => {
  const particles = useRef<Particle[]>([]);

  const addParticle = useCallback((
    x: number,
    y: number,
    color: string,
    alpha = 1,
    radius = 5,
  ): void => {
    particles.current.push({ x, y, alpha, radius, color });
    if (particles.current.length > MAX_PARTICLES) {
      particles.current.splice(0, particles.current.length - MAX_PARTICLES);
    }
  }, []);

  const tickParticles = useCallback((): void => {
    particles.current = particles.current
      .map((particle: Particle): Particle => ({
        ...particle,
        alpha: particle.alpha - 0.045,
        radius: Math.max(1, particle.radius - 0.18),
      }))
      .filter((particle: Particle): boolean => particle.alpha > 0);
  }, []);

  return { particles, addParticle, tickParticles };
};

export default useParticleTrail;
