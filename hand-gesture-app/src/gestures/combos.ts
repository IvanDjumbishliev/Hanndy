import type { ComboDefinition } from '../hooks/useGestureCombo';

export const COMBOS: ComboDefinition[] = [
  {
    id: 'victory',
    sequence: ['ThumbsUp', 'Peace'],
    windowMs: 2500,
    label: '🏆 Victory Salute',
    effect: 'confetti',
  },
  {
    id: 'danger',
    sequence: ['ThumbsDown', 'Fist'],
    windowMs: 2500,
    label: '💥 Danger Mode',
    effect: 'glitch',
  },
  {
    id: 'matrix',
    sequence: ['Peace', 'Peace', 'Peace'],
    windowMs: 3000,
    label: '🟢 Matrix Mode',
    effect: 'matrix',
  },
  {
    id: 'firework',
    sequence: ['OK', 'ThumbsUp', 'OpenHand'],
    windowMs: 3500,
    label: '🎆 Fireworks',
    effect: 'fireworks',
  },
];
