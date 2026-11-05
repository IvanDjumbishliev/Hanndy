import confetti from 'canvas-confetti';
import { memo, useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { GestureResult } from '../types/gestures';
import { GESTURE_EMOJI } from '../gestures/emojiMap';
import styles from './GestureDemo.module.css';

interface GestureDemoProps {
  hands: Array<{ gesture: GestureResult; handedness: 'Left' | 'Right' }>;
}

const GestureDemo = ({ hands }: GestureDemoProps): ReactElement => {
  const panelRef = useRef<HTMLElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousGesturesRef = useRef<Partial<Record<'Left' | 'Right', GestureResult['gestureName']>>>({});
  const [likes, setLikes] = useState<number>(0);
  const [musicEnabled, setMusicEnabled] = useState<boolean>(false);
  const [musicError, setMusicError] = useState<string | null>(null);

  useEffect((): void => {
    let pointingLandmarks: GestureResult['landmarks'] | null = null;
    for (const { gesture, handedness } of hands) {
      if (gesture.gestureName === 'Pointing') pointingLandmarks = gesture.landmarks;

      if (previousGesturesRef.current[handedness] === gesture.gestureName) continue;
      previousGesturesRef.current[handedness] = gesture.gestureName;

      switch (gesture.gestureName) {
        case 'Fist':
          confetti({ particleCount: 100, spread: 70 });
          break;
        case 'ThumbsUp':
          queueMicrotask((): void => setLikes((count: number): number => count + 1));
          break;
        case 'ThumbsDown':
          queueMicrotask((): void => setLikes((count: number): number => Math.max(0, count - 1)));
          break;
        case 'Peace':
          queueMicrotask((): void => {
            setMusicError(null);
            setMusicEnabled((enabled: boolean): boolean => !enabled);
          });
          break;
        case 'OpenHand':
          queueMicrotask((): void => {
            setLikes(0);
            setMusicEnabled(false);
            setMusicError(null);
          });
          break;
        default:
          break;
      }
    }

    const cursor = cursorRef.current;
    const panel = panelRef.current;
    if (!cursor || !panel) return;
    if (!pointingLandmarks) {
      cursor.style.opacity = '0';
      return;
    }

    const indexTip = pointingLandmarks[8];
    if (!indexTip) return;
    const bounds = panel.getBoundingClientRect();
    cursor.style.left = `${indexTip.x * bounds.width}px`;
    cursor.style.top = `${indexTip.y * bounds.height}px`;
    cursor.style.opacity = '1';
  }, [hands]);

  useEffect((): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!musicEnabled) {
      audio.pause();
      audio.currentTime = 0;
      return;
    }

    void audio.play().catch((): void => {
      setMusicError('Music playback was blocked by the browser.');
      setMusicEnabled(false);
    });
  }, [musicEnabled]);

  return (
    <aside className={styles.panel} ref={panelRef} aria-label="Gesture demo">
      <h2 className={styles.title}>Gesture Demo</h2>
      <div className={styles.likes}>
        <span className={styles.likesValue} key={likes}>{likes}</span>
        <span className={styles.likesLabel}>👍 Likes</span>
      </div>
      <div className={styles.musicStatus} aria-live="polite">
        <span aria-hidden="true">{musicEnabled ? '🎵' : '🔇'}</span>
        <span>{musicEnabled ? 'Music on' : 'Music off'}</span>
      </div>
      {musicError && (
        <div className={styles.musicError} role="status">
          <span>{musicError}</span>
          <button
            className={styles.enableMusicButton}
            type="button"
            onClick={(): void => {
              setMusicError(null);
              setMusicEnabled(true);
            }}
          >
            Enable playback
          </button>
        </div>
      )}
      <div className={styles.cursorArea} aria-label="Pointing cursor demo">
        <span className={styles.cursorLabel}>Pointing cursor</span>
        <div className={styles.cursorDot} ref={cursorRef} aria-hidden="true" />
      </div>
      <table className={styles.legend}>
        <caption>Gesture actions</caption>
        <tbody>
          <tr><td>{GESTURE_EMOJI.Fist} Fist</td><td>Confetti</td></tr>
          <tr><td>{GESTURE_EMOJI.ThumbsUp} ThumbsUp</td><td>Like</td></tr>
          <tr><td>{GESTURE_EMOJI.ThumbsDown} ThumbsDown</td><td>Unlike</td></tr>
          <tr><td>{GESTURE_EMOJI.Peace} Peace</td><td>Toggle music</td></tr>
          <tr><td>{GESTURE_EMOJI.Pointing} Pointing</td><td>Move cursor</td></tr>
          <tr><td>{GESTURE_EMOJI.OpenHand} OpenHand</td><td>Reset demo</td></tr>
        </tbody>
      </table>
      <audio
        ref={audioRef}
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        loop
        preload="none"
      />
    </aside>
  );
};

export default memo(GestureDemo);
