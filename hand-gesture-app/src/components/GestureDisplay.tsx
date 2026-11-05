import { memo } from 'react';
import type { ReactElement } from 'react';
import type { GestureResult } from '../types/gestures';
import { GESTURE_EMOJI } from '../gestures/emojiMap';

interface GestureDisplayProps {
  hands: Array<{ gesture: GestureResult; handedness: 'Left' | 'Right' }>;
}

const handColors: Record<'Left' | 'Right', string> = {
  Left: '#00f5ff',
  Right: '#ff00e5',
};

const GestureDisplay = ({ hands }: GestureDisplayProps): ReactElement => (
  <section className={`gesture-display${hands.length === 1 ? ' gesture-display--single' : ''}`} aria-live="polite">
    {hands.length === 0 ? (
      <article className="gesture-card gesture-card--placeholder">— No hand detected —</article>
    ) : hands.map(({ gesture, handedness }) => (
      <article className="gesture-card" key={handedness}>
        <div className="gesture-card__hand">
          <span
            className="gesture-card__dot"
            style={{ backgroundColor: handColors[handedness] }}
            aria-hidden="true"
          />
          {handedness}
        </div>
        <div className="gesture-display__name">
          <span aria-hidden="true">{GESTURE_EMOJI[gesture.gestureName]}</span>
          {gesture.gestureName}
        </div>
        <div
          className="gesture-display__track"
          role="progressbar"
          aria-label={`${handedness} hand gesture confidence`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(gesture.confidence * 100)}
        >
          <div
            className="gesture-display__bar"
            style={{ width: `${gesture.confidence * 100}%`, backgroundColor: handColors[handedness] }}
          />
        </div>
        <span className="gesture-display__confidence">{Math.round(gesture.confidence * 100)}% confidence</span>
      </article>
    ))}
  </section>
);

export default memo(GestureDisplay);
