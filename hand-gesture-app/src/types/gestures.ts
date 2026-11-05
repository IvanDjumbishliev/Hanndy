export type GestureName =
  | 'Fist'
  | 'OpenHand'
  | 'ThumbsUp'
  | 'ThumbsDown'
  | 'Peace'
  | 'Pointing'
  | 'OK'
  | 'Pinch'
  | 'ThreeFingers'
  | 'SpiderMan'
  | 'Unknown';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface GestureResult {
  gestureName: GestureName;
  confidence: number;
  handedness: 'Left' | 'Right';
  landmarks: HandLandmark[];
}
