import { memo, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { GestureName } from '../types/gestures';
import styles from './GestureHistory.module.css';

export interface HistoryEntry {
  id: string;
  gestureName: GestureName;
  handedness: 'Left' | 'Right';
  emoji: string;
  timestamp: number;
}

interface GestureHistoryProps {
  entries: HistoryEntry[];
  onClear: () => void;
}

const formatElapsedTime = (timestamp: number, now: number): string => {
  const elapsedSeconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (elapsedSeconds < 60) return `${elapsedSeconds}s ago`;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  return `${Math.floor(elapsedMinutes / 60)}h ago`;
};

const GestureHistory = ({ entries, onClear }: GestureHistoryProps): ReactElement => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [now, setNow] = useState<number>(0);

  useEffect((): (() => void) => {
    const initialTimeoutId = window.setTimeout((): void => setNow(Date.now()), 0);
    const intervalId = window.setInterval((): void => setNow(Date.now()), 1000);
    return (): void => {
      window.clearTimeout(initialTimeoutId);
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect((): void => {
    const container = scrollContainerRef.current;
    if (container) container.scrollLeft = container.scrollWidth;
  }, [entries]);

  return (
    <section className={styles.history} aria-label="Recent gesture history">
      <div className={styles.entries} ref={scrollContainerRef}>
        {entries.map((entry: HistoryEntry) => (
          <div
            className={`${styles.entry} ${entry.handedness === 'Left' ? styles.leftEntry : styles.rightEntry}`}
            key={entry.id}
          >
            <span aria-hidden="true">{entry.emoji}</span>
            <span>{entry.gestureName}</span>
            <time dateTime={new Date(entry.timestamp).toISOString()}>
              {formatElapsedTime(entry.timestamp, now)}
            </time>
          </div>
        ))}
      </div>
      <button className={styles.clearButton} type="button" onClick={onClear}>
        Clear history
      </button>
    </section>
  );
};

export default memo(GestureHistory);
