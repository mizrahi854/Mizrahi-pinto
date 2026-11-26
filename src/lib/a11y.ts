import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * "Reduce Transparency" (iOS setting / `prefers-reduced-transparency` on web).
 * HIG accessibility: blur and translucent layers need an opaque answer.
 */
export function useReduceTransparency() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (Platform.OS === 'web') {
      const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-transparency: reduce)') : null;
      if (!mq) return;
      setOn(mq.matches);
      const f = (e: MediaQueryListEvent) => setOn(e.matches);
      mq.addEventListener?.('change', f);
      return () => mq.removeEventListener?.('change', f);
    }
    AccessibilityInfo.isReduceTransparencyEnabled?.().then(setOn).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setOn);
    return () => sub.remove();
  }, []);
  return on;
}
