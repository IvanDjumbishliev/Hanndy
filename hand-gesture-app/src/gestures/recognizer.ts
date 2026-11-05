import type { GestureName, HandLandmark } from '../types/gestures';

type FingerName = 'index' | 'middle' | 'ring' | 'pinky';

const fingerJoints: Record<FingerName, { pip: number; tip: number }> = {
  index: { pip: 6, tip: 8 },
  middle: { pip: 10, tip: 12 },
  ring: { pip: 14, tip: 16 },
  pinky: { pip: 18, tip: 20 },
};

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const distance = (first: HandLandmark, second: HandLandmark): number =>
  Math.hypot(first.x - second.x, first.y - second.y);

const isValidLandmark = (landmark: HandLandmark | undefined): landmark is HandLandmark =>
  landmark !== undefined && Number.isFinite(landmark.x) && Number.isFinite(landmark.y);

const combineScores = (scores: number[]): number => {
  if (scores.some((score: number): boolean => score <= 0)) return 0;
  const geometricMean = scores.reduce((product: number, score: number): number => product * score, 1)
    ** (1 / scores.length);
  return Math.min(geometricMean, ...scores);
};

export function recognizeGesture(landmarks: HandLandmark[]): { name: GestureName; confidence: number } {
  if (landmarks.length < 21) return { name: 'Unknown', confidence: 0 };

  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  const thumbMcp = landmarks[2];
  const thumbTip = landmarks[4];
  const indexMcp = landmarks[5];
  if (
    !isValidLandmark(wrist)
    || !isValidLandmark(middleMcp)
    || !isValidLandmark(thumbMcp)
    || !isValidLandmark(thumbTip)
    || !isValidLandmark(indexMcp)
  ) {
    return { name: 'Unknown', confidence: 0 };
  }

  const handScale = Math.max(distance(wrist, middleMcp), 0.05);
  const fingers = {} as Record<FingerName, { extended: number; curled: number }>;

  for (const [name, joints] of Object.entries(fingerJoints) as [FingerName, typeof fingerJoints[FingerName]][]) {
    const pip = landmarks[joints.pip];
    const tip = landmarks[joints.tip];
    if (!isValidLandmark(pip) || !isValidLandmark(tip)) return { name: 'Unknown', confidence: 0 };
    const verticalGap = (pip.y - tip.y) / handScale;
    fingers[name] = {
      extended: clamp((verticalGap + 0.02) / 0.08),
      curled: clamp((-verticalGap + 0.02) / 0.08),
    };
  }

  const thumbExtension = clamp((distance(thumbTip, indexMcp) / handScale - 0.35) / 0.35);
  const thumbCurl = 1 - thumbExtension;
  const thumbUp = Math.min(
    thumbExtension,
    clamp(((thumbMcp.y - thumbTip.y) / handScale + 0.02) / 0.08),
  );
  const thumbDown = Math.min(
    thumbExtension,
    clamp(((thumbTip.y - thumbMcp.y) / handScale + 0.02) / 0.08),
  );
  const thumbTipDistance = distance(thumbTip, landmarks[8] ?? thumbTip);
  const pinchScore = clamp(1 - thumbTipDistance / 0.06);
  const okPinchScore = clamp(1 - thumbTipDistance / 0.1);

  const allCurled = (): number[] => [
    fingers.index.curled,
    fingers.middle.curled,
    fingers.ring.curled,
    fingers.pinky.curled,
  ];
  const allExtended = (): number[] => [
    fingers.index.extended,
    fingers.middle.extended,
    fingers.ring.extended,
    fingers.pinky.extended,
  ];
  const candidates: Array<{ name: GestureName; confidence: number }> = [
    { name: 'ThumbsUp', confidence: combineScores([thumbUp, ...allCurled()]) },
    { name: 'ThumbsDown', confidence: combineScores([thumbDown, ...allCurled()]) },
    { name: 'Pinch', confidence: combineScores([pinchScore, fingers.middle.curled, fingers.ring.curled, fingers.pinky.curled]) },
    { name: 'Fist', confidence: combineScores(allCurled()) },
    { name: 'OpenHand', confidence: combineScores([...allExtended(), thumbExtension]) },
    {
      name: 'Peace',
      confidence: combineScores([
        fingers.index.extended,
        fingers.middle.extended,
        fingers.ring.curled,
        fingers.pinky.curled,
        thumbCurl,
      ]),
    },
    {
      name: 'Pointing',
      confidence: combineScores([
        fingers.index.extended,
        fingers.middle.curled,
        fingers.ring.curled,
        fingers.pinky.curled,
        thumbCurl,
      ]),
    },
    {
      name: 'OK',
      confidence: combineScores([
        okPinchScore,
        fingers.middle.extended,
        fingers.ring.extended,
        fingers.pinky.extended,
      ]),
    },
    {
      name: 'ThreeFingers',
      confidence: combineScores([
        fingers.index.extended,
        fingers.middle.extended,
        fingers.ring.extended,
        fingers.pinky.curled,
        thumbCurl,
      ]),
    },
    {
      name: 'SpiderMan',
      confidence: combineScores([
        fingers.index.extended,
        fingers.middle.curled,
        fingers.ring.curled,
        fingers.pinky.extended,
        thumbExtension,
      ]),
    },
  ];

  candidates.sort((first, second) => second.confidence - first.confidence);
  const best = candidates[0];
  if (!best || best.confidence < 0.5) return { name: 'Unknown', confidence: 0 };
  return best;
}
