import { describe, expect, it } from 'vitest';
import type { GestureName, HandLandmark } from '../types/gestures';
import { recognizeGesture } from './recognizer';

const createHand = (
  extendedFingers: Array<'index' | 'middle' | 'ring' | 'pinky'>,
  thumb: 'curled' | 'extended' | 'up' | 'down',
  pinched = false,
): HandLandmark[] => {
  const landmarks = Array.from({ length: 21 }, (): HandLandmark => ({ x: 0.5, y: 0.5, z: 0 }));
  landmarks[0] = { x: 0.5, y: 0.8, z: 0 };
  landmarks[2] = { x: 0.38, y: 0.6, z: 0 };
  landmarks[3] = { x: 0.4, y: 0.58, z: 0 };
  landmarks[4] = thumb === 'up'
    ? { x: 0.15, y: 0.3, z: 0 }
    : thumb === 'down'
      ? { x: 0.15, y: 0.78, z: 0 }
      : thumb === 'extended'
        ? { x: 0.15, y: 0.5, z: 0 }
        : { x: 0.42, y: 0.56, z: 0 };
  landmarks[5] = { x: 0.4, y: 0.45, z: 0 };
  landmarks[9] = { x: 0.5, y: 0.5, z: 0 };

  const fingerIndices = {
    index: { pip: 6, tip: 8, x: 0.4 },
    middle: { pip: 10, tip: 12, x: 0.5 },
    ring: { pip: 14, tip: 16, x: 0.6 },
    pinky: { pip: 18, tip: 20, x: 0.7 },
  };
  for (const [name, indices] of Object.entries(fingerIndices) as [
    keyof typeof fingerIndices,
    typeof fingerIndices[keyof typeof fingerIndices],
  ][]) {
    landmarks[indices.pip] = { x: indices.x, y: 0.45, z: 0 };
    landmarks[indices.tip] = {
      x: pinched && name === 'index' ? 0.42 : indices.x,
      y: pinched && name === 'index' ? 0.56 : extendedFingers.includes(name) ? 0.3 : 0.56,
      z: 0,
    };
  }
  if (pinched) landmarks[4] = { x: 0.42, y: 0.56, z: 0 };
  return landmarks;
};

describe('recognizeGesture', (): void => {
  const cases: Array<[GestureName, HandLandmark[]]> = [
    ['Fist', createHand([], 'curled')],
    ['OpenHand', createHand(['index', 'middle', 'ring', 'pinky'], 'extended')],
    ['ThumbsUp', createHand([], 'up')],
    ['ThumbsDown', createHand([], 'down')],
    ['Peace', createHand(['index', 'middle'], 'curled')],
    ['Pointing', createHand(['index'], 'curled')],
    ['OK', createHand(['middle', 'ring', 'pinky'], 'curled', true)],
    ['Pinch', createHand([], 'curled', true)],
    ['ThreeFingers', createHand(['index', 'middle', 'ring'], 'curled')],
    ['SpiderMan', createHand(['index', 'pinky'], 'extended')],
  ];

  it.each(cases)('recognizes %s', (expected, landmarks): void => {
    expect(recognizeGesture(landmarks)).toMatchObject({
      name: expected,
      confidence: expect.any(Number),
    });
    expect(recognizeGesture(landmarks).confidence).toBeGreaterThanOrEqual(0.5);
  });

  it('returns Unknown for invalid or ambiguous landmarks', (): void => {
    expect(recognizeGesture([])).toEqual({ name: 'Unknown', confidence: 0 });
    expect(recognizeGesture(createHand([], 'curled').map(() => ({ x: 0.5, y: 0.5, z: 0 })))).toEqual({
      name: 'Unknown',
      confidence: 0,
    });
  });
});
