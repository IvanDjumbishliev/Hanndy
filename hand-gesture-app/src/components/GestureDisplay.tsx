import { memo } from 'react';
import type { ReactElement } from 'react';
import type { GestureResult } from '../types/gestures';

const gestureEmoji: Record<GestureResult['gestureName'], string> = {
  Fist: '✊',
  OpenHand: '✋',
  ThumbsUp: '👍',
  ThumbsDown: '👎',
  Peace: '✌️',
  Pointing: '☝️',
  OK: '👌',
  Pinch: '🤏',
  ThreeFingers: '🤟',
};

interface GestureDisplayProps {
  gesture: GestureResult | null;
}

const GestureDisplay = ({ gesture }: GestureDisplayProps): ReactElement => (
  <section className="gesture-display glassmorphism" aria-live="polite">
    <span className="gesture-display__label">Current gesture</span>
    <div className="gesture-display__name">
      <span aria-hidden="true">{gesture ? gestureEmoji[gesture.gestureName] : '👋'}</span>
      {gesture?.gestureName ?? 'No hand gesture'}
    </div>
    {gesture && (
      <>
        <div className="gesture-display__meta">{gesture.handedness} hand · heuristic match</div>
        <div
          className="gesture-display__track"
          role="progressbar"
          aria-label="Gesture confidence"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(gesture.confidence * 100)}
        >
          <div className="gesture-display__bar" style={{ width: `${gesture.confidence * 100}%` }} />
        </div>
        <span className="gesture-display__confidence">{Math.round(gesture.confidence * 100)}% confidence</span>
      </>
    )}
  </section>
);

export default memo(GestureDisplay);
