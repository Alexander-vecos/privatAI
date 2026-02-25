import { useEffect, useRef, useCallback } from 'react';

interface SwipeOptions {
  threshold?: number; // minimum distance for swipe (default 50)
  delay?: number; // maximum time for swipe (default 250)
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

/**
 * Hook для обнаружения свайпов
 * @param options - Configuration
 * @returns ref to attach to element
 */
export function useSwipe(options: SwipeOptions) {
  const {
    threshold = 50,
    delay = 250,
    onSwipeUp,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
  } = options;

  const ref = useRef<HTMLElement>(null);
  const startTouchRef = useRef<TouchPoint | null>(null);

  const handleSwipe = useCallback(
    (start: TouchPoint, end: TouchPoint) => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const deltaTime = end.time - start.time;

      // Check if swipe happened within time limit
      if (deltaTime > delay) return;

      // Determine swipe direction
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      } else {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      }
    },
    [threshold, delay, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      startTouchRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!startTouchRef.current) return;

      const touch = e.changedTouches[0];
      const endTouch: TouchPoint = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };

      handleSwipe(startTouchRef.current, endTouch);
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleSwipe]);

  return ref;
}
