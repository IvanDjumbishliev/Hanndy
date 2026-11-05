import type { ReactElement } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  isLoading: boolean;
  isFadingOut: boolean;
  onStart: () => void;
}

const SplashScreen = ({ isLoading, isFadingOut, onStart }: SplashScreenProps): ReactElement => (
  <main className={`${styles.splash} ${isFadingOut ? styles.fadeOut : ''}`}>
    <div className={styles.content}>
      <svg
        className={styles.logo}
        viewBox="0 0 120 120"
        role="img"
        aria-label="Hand logo"
      >
        <path
          d="M37 107V76c-8-7-17-15-21-22-3-5-1-10 3-12 5-2 9 2 13 6l12 12V28c0-6 4-10 9-10s9 4 9 10v28V17c0-6 4-10 9-10s9 4 9 10v39V24c0-6 4-10 9-10s9 4 9 10v39V39c0-6 4-10 9-10s9 4 9 10v35c0 25-16 42-41 42H55c-8 0-14-3-18-9Z"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 className={styles.title}>Hanndy</h1>
      <p className={styles.tagline}>Control the web with your hands</p>
      <ul className={styles.badges} aria-label="Technologies">
        <li>MediaPipe</li>
        <li>React</li>
        <li>TypeScript</li>
      </ul>
      <button className={styles.startButton} type="button" onClick={onStart} disabled={isLoading}>
        {isLoading && <span className={styles.spinner} aria-hidden="true" />}
        {isLoading ? 'Starting Camera…' : 'Start Camera'}
      </button>
      <p className={styles.footer}>
        No video ever leaves your device · All ML runs in your browser
      </p>
    </div>
  </main>
);

export default SplashScreen;
