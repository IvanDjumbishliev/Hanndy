import { memo, useState } from 'react';
import type { ReactElement } from 'react';
import type { PerformanceMeasurement } from '../types/tracking';

interface PerformanceStatsProps extends PerformanceMeasurement {}

const PerformanceStats = ({ fps, inferenceTime }: PerformanceStatsProps): ReactElement => {
  const [expanded, setExpanded] = useState<boolean>(false);
  return (
    <section className="performance-stats glassmorphism">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={(): void => setExpanded((previous: boolean): boolean => !previous)}
      >
        Performance {expanded ? '−' : '+'}
      </button>
      {expanded && (
        <dl>
          <div><dt>FPS</dt><dd>{fps.toFixed(1)}</dd></div>
          <div><dt>Inference</dt><dd>{inferenceTime.toFixed(1)} ms</dd></div>
        </dl>
      )}
    </section>
  );
};

export default memo(PerformanceStats);
