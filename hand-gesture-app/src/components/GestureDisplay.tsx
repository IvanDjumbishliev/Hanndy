import { memo } from 'react';
import type { ReactElement } from 'react';
import type { GestureResult } from '../types/gestures';
import { GESTURE_EMOJI } from '../gestures/emojiMap';
import styles from './GestureDisplay.module.css';

interface GestureDisplayProps {
  hands: Array<{ gesture: GestureResult; handedness: 'Left' | 'Right' }>;
}

const GestureDisplay = ({ hands }: GestureDisplayProps): ReactElement => (
  <section className={styles.display} aria-label="Detected gestures" aria-live="polite">
    {hands.length === 0 ? (
      <article className={`${styles.card} ${styles.placeholder}`} key="placeholder">
        <span className={styles.emoji} aria-hidden="true">🤚</span>
        <span className={styles.placeholderText}>No hand detected</span>
      </article>
    ) : hands.map(({ gesture, handedness }) => {
      const percentage = Math.round(gesture.confidence * 100);
      const confidenceClass = gesture.confidence >= 0.8
        ? styles.highConfidence
        : gesture.confidence >= 0.5
          ? styles.mediumConfidence
          : styles.lowConfidence;

      return (
        <article className={styles.card} key={`${handedness}-${gesture.gestureName}`}>
          <span className={`${styles.badge} ${handedness === 'Left' ? styles.leftBadge : styles.rightBadge}`}>
            {handedness} Hand
          </span>
          <span className={styles.emoji} aria-hidden="true">{GESTURE_EMOJI[gesture.gestureName]}</span>
          <h2 className={styles.gestureName}>
            {gesture.gestureName} <span aria-hidden="true">{GESTURE_EMOJI[gesture.gestureName]}</span>
          </h2>
          <progress
            className={`${styles.confidenceTrack} ${confidenceClass}`}
            value={percentage}
            max={100}
            aria-label={`${handedness} hand confidence`}
          />
          <span className={styles.confidenceLabel}>{percentage}%</span>
        </article>
      );
    })}
  </section>
);

export default memo(GestureDisplay);
