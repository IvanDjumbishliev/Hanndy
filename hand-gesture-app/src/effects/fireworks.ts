import confetti from 'canvas-confetti';

export const triggerFireworks = (): (() => void) => {
  const timeoutIds: number[] = [];
  for (let burst = 0; burst < 6; burst += 1) {
    const timeoutId = window.setTimeout((): void => {
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 55,
        origin: { x: Math.random(), y: 0.25 + Math.random() * 0.5 },
      });
    }, burst * 150);
    timeoutIds.push(timeoutId);
  }
  return (): void => timeoutIds.forEach((timeoutId: number): void => window.clearTimeout(timeoutId));
};
