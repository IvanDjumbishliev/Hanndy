import { useCallback, useEffect, useRef, useState } from 'react';
import type { GestureName } from '../types/gestures';

export interface ComboDefinition {
  id: string;
  sequence: GestureName[];
  windowMs: number;
  label: string;
  effect: 'confetti' | 'fireworks' | 'matrix' | 'glitch';
}

interface GestureLogEntry {
  name: GestureName;
  timestamp: number;
}

interface GestureComboResult {
  lastCombo: ComboDefinition | null;
  clearLastCombo: () => void;
}

const useGestureCombo = (
  currentGesture: GestureName | null,
  combos: ComboDefinition[],
): GestureComboResult => {
  const gestureLogRef = useRef<GestureLogEntry[]>([]);
  const [lastCombo, setLastCombo] = useState<ComboDefinition | null>(null);

  useEffect((): void => {
    if (currentGesture === null || currentGesture === 'Unknown') return;

    const now = Date.now();
    gestureLogRef.current.push({ name: currentGesture, timestamp: now });

    const matchedCombo = combos.find((combo: ComboDefinition): boolean => {
      if (gestureLogRef.current.length < combo.sequence.length) return false;
      const sequenceStart = gestureLogRef.current.length - combo.sequence.length;
      const tail = gestureLogRef.current.slice(sequenceStart);
      if (!tail.every((entry: GestureLogEntry, index: number): boolean =>
        entry.name === combo.sequence[index])) return false;
      const firstEntry = tail[0];
      return firstEntry !== undefined && now - firstEntry.timestamp <= combo.windowMs;
    });

    if (matchedCombo) {
      setLastCombo({ ...matchedCombo });
      gestureLogRef.current = [];
      return;
    }

    gestureLogRef.current = gestureLogRef.current.filter(
      (entry: GestureLogEntry): boolean => now - entry.timestamp <= 3000,
    );
  }, [combos, currentGesture]);

  const clearLastCombo = useCallback((): void => setLastCombo(null), []);

  return { lastCombo, clearLastCombo };
};

export default useGestureCombo;
