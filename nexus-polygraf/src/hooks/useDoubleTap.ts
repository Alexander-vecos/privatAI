import { useRef } from 'react';

interface DoubleTapOptions {
  delay?: number;
  onDoubleTap: () => void;
  onSingleTap?: () => void;
}

/**
 * Simple double-tap detection hook (stub - not used in current implementation)
 */
export function useDoubleTap(options: DoubleTapOptions) {
  const ref = useRef<HTMLElement>(null);
  return ref;
}
