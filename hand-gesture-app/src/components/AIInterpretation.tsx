import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import styles from './AIInterpretation.module.css';

interface AIInterpretationProps {
  text: string | null;
  loading: boolean;
}

const AIInterpretation = ({ text, loading }: AIInterpretationProps): ReactElement => {
  return (
    <aside className={styles.panel} aria-label="AI gesture interpretation" aria-live="polite">
      <div className={styles.label}>⬡ JARVIS ANALYSIS</div>
      {loading ? (
        <p className={`${styles.text} ${styles.loading}`} aria-label="Analyzing gestures">
          <span>.</span><span>.</span><span>.</span>
        </p>
      ) : text ? (
        <p className={`${styles.text} ${text === 'Signal unclear. Stand by.' ? styles.muted : ''}`}>
          <TypewriterText key={text} text={text} />
        </p>
      ) : (
        <p className={`${styles.text} ${styles.muted}`}>Awaiting gesture sequence</p>
      )}
    </aside>
  );
};

const TypewriterText = ({ text }: { text: string }): ReactElement => {
  const [visibleLength, setVisibleLength] = useState<number>(0);

  useEffect((): (() => void) => {
    let characterIndex = 0;
    const intervalId = window.setInterval((): void => {
      characterIndex += 1;
      setVisibleLength(characterIndex);
      if (characterIndex >= text.length) window.clearInterval(intervalId);
    }, 35);
    return (): void => window.clearInterval(intervalId);
  }, [text]);

  return <>{text.slice(0, visibleLength)}</>;
};

export default AIInterpretation;
