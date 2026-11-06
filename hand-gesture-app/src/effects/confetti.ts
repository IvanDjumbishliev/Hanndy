import confetti from 'canvas-confetti';

const triggerConfetti = (): void => {
  confetti({ particleCount: 180, spread: 100, origin: { y: 0.6 } });
};

export default triggerConfetti;
