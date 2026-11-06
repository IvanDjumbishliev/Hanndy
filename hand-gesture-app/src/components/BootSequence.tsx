import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import styles from './BootSequence.module.css';

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LINES = [
  '> HANNDY GESTURE INTERFACE v2.0',
  '> INITIALIZING MEDIAPIPE RUNTIME..........  ✓',
  '> REQUESTING CAMERA ACCESS..................  ✓',
  '> LOADING GESTURE CLASSIFIER................  ✓',
  '> CALIBRATING LANDMARK SMOOTHER.............  ✓',
  '> MULTI-HAND ENGINE ONLINE..................  ✓',
  '> HUD PANELS NOMINAL........................  ✓',
  '> ALL SYSTEMS OPERATIONAL',
  '> WELCOME, OPERATOR.',
];

const BootSequence = ({ onComplete }: BootSequenceProps): ReactElement => {
  const [completedLines, setCompletedLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState<string | null>('');
  const [isExiting, setIsExiting] = useState<boolean>(false);

  useEffect((): (() => void) => {
    let intervalId: number | undefined;
    let timeoutId: number | undefined;

    const typeLine = (lineIndex: number): void => {
      const line = BOOT_LINES[lineIndex];
      if (line === undefined) return;

      let characterIndex = 0;
      setCurrentLine('');
      intervalId = window.setInterval((): void => {
        characterIndex += 1;
        setCurrentLine(line.slice(0, characterIndex));

        if (characterIndex < line.length) return;

        window.clearInterval(intervalId);
        setCompletedLines((previous: string[]): string[] => [...previous, line]);
        setCurrentLine(null);

        if (lineIndex === BOOT_LINES.length - 1) {
          timeoutId = window.setTimeout((): void => {
            setIsExiting(true);
            timeoutId = window.setTimeout(onComplete, 400);
          }, 800);
          return;
        }

        timeoutId = window.setTimeout((): void => typeLine(lineIndex + 1), 120);
      }, 30);
    };

    typeLine(0);
    return (): void => {
      if (intervalId !== undefined) window.clearInterval(intervalId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [onComplete]);

  return (
    <main className={`${styles.bootScreen} ${isExiting ? styles.exit : ''}`} aria-label="Hanndy boot sequence">
      <div className={styles.terminal} aria-live="polite">
        {completedLines.map((line: string, index: number) => (
          <div
            className={`${styles.line} ${index === BOOT_LINES.length - 1 ? styles.finalLine : styles.completedLine}`}
            key={line}
          >
            {line}
          </div>
        ))}
        {currentLine !== null && (
          <div className={styles.line}>
            {currentLine}
            <span className={styles.cursor} aria-hidden="true">█</span>
          </div>
        )}
      </div>
    </main>
  );
};

export default BootSequence;
