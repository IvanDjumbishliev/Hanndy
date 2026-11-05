import { memo, useState } from 'react';
import type { ReactElement } from 'react';
import styles from './PerformanceStats.module.css';

interface PerformanceStatsProps {
  fps: number;
  inferenceMs: number;
  handsDetected: number;
  isSmoothing: boolean;
}

const PerformanceStats = ({
  fps,
  inferenceMs,
  handsDetected,
  isSmoothing,
}: PerformanceStatsProps): ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const fpsClass = fps >= 50 ? styles.good : fps >= 25 ? styles.warning : styles.bad;
  const inferenceClass = inferenceMs < 25 ? styles.good : inferenceMs < 50 ? styles.warning : styles.bad;

  return (
    <section className={styles.panel}>
      <button
        className={styles.toggle}
        type="button"
        aria-expanded={expanded}
        onClick={(): void => setExpanded((previous: boolean): boolean => !previous)}
      >
        📊 Stats
      </button>
      {expanded && (
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt>FPS</dt>
            <dd>{fps.toFixed(1)}</dd>
          </div>
          <progress className={`${styles.bar} ${fpsClass}`} value={Math.min(fps, 60)} max={60} aria-label="FPS" />
          <div className={styles.metric}>
            <dt>Inference</dt>
            <dd>{inferenceMs.toFixed(1)} ms</dd>
          </div>
          <progress
            className={`${styles.bar} ${inferenceClass}`}
            value={Math.min(inferenceMs, 50)}
            max={50}
            aria-label="Inference time"
          />
          <div className={styles.metric}>
            <dt>Hands detected</dt>
            <dd>{handsDetected}</dd>
          </div>
          <div className={styles.metric}>
            <dt>Smoothing</dt>
            <dd>{isSmoothing ? 'ON' : 'OFF'}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};

export default memo(PerformanceStats);
