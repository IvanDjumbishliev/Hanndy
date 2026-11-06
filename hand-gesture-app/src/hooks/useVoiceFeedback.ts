import { useCallback, useEffect, useRef } from 'react';

export interface VoiceFeedbackOptions {
  enabled: boolean;
  volume: number;
  rate: number;
  pitch: number;
}

interface VoiceFeedback {
  speak: (text: string) => void;
  cancel: () => void;
}

const chooseVoice = (): SpeechSynthesisVoice | null => {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((voice: SpeechSynthesisVoice): boolean =>
    voice.name.includes('Google UK English Male'))
    ?? voices.find((voice: SpeechSynthesisVoice): boolean => /^en(-|$)/i.test(voice.lang))
    ?? voices.find((voice: SpeechSynthesisVoice): boolean => voice.default)
    ?? null;
};

const useVoiceFeedback = (options: VoiceFeedbackOptions): VoiceFeedback => {
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);

  useEffect((): (() => void) | void => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const updateVoice = (): void => {
      voiceRef.current = chooseVoice();
    };
    updateVoice();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoice);

    return (): void => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string): void => {
    if (!options.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = Math.max(0, Math.min(1, options.volume));
    utterance.rate = options.rate;
    utterance.pitch = options.pitch;
    utterance.voice = voiceRef.current;
    window.speechSynthesis.speak(utterance);
  }, [options.enabled, options.pitch, options.rate, options.volume]);

  const cancel = useCallback((): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, cancel };
};

export default useVoiceFeedback;
