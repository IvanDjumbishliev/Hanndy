import { memo } from 'react';
import type { ReactElement } from 'react';
import type { GestureHistoryItem } from '../types/tracking';

interface GestureHistoryProps {
  items: GestureHistoryItem[];
}

const GestureHistory = ({ items }: GestureHistoryProps): ReactElement => (
  <section className="gesture-history glassmorphism" aria-label="Gesture history">
    <h2>Gesture History</h2>
    <ol>
      {items.length === 0 && <li className="gesture-history__empty">Detected gestures will appear here.</li>}
      {[...items].reverse().map((item: GestureHistoryItem) => (
        <li key={item.id}>
          <span>{item.gesture.gestureName}</span>
          <span>{Math.round(item.gesture.confidence * 100)}%</span>
          <time dateTime={new Date(item.detectedAt).toISOString()}>
            {new Date(item.detectedAt).toLocaleTimeString()}
          </time>
        </li>
      ))}
    </ol>
  </section>
);

export default memo(GestureHistory);
