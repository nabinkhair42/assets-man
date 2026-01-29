"use client";

import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  /** Minimum distance in pixels to trigger a swipe (default: 50) */
  threshold?: number;
  /** Maximum time in ms for a swipe gesture (default: 300) */
  maxTime?: number;
  /** Whether to prevent default touch behavior (default: false) */
  preventDefault?: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

/**
 * Hook to detect swipe gestures on touch devices
 * Returns touch event handlers to attach to an element
 */
export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, maxTime = 300, preventDefault = false } = options;
  const swipeState = useRef<SwipeState | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefault && swipeState.current) {
      // Only prevent if we're in a swipe gesture
      const touch = e.touches[0];
      if (touch) {
        const deltaX = Math.abs(touch.clientX - swipeState.current.startX);
        const deltaY = Math.abs(touch.clientY - swipeState.current.startY);
        // If horizontal movement is dominant, prevent scroll
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
        }
      }
    }
  }, [preventDefault]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swipeState.current) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const { startX, startY, startTime } = swipeState.current;
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startX;
    const deltaY = endY - startY;
    const deltaTime = endTime - startTime;

    // Check if swipe is within time limit
    if (deltaTime > maxTime) {
      swipeState.current = null;
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Horizontal swipe (dominant direction)
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        handlersRef.current.onSwipeRight?.();
      } else {
        handlersRef.current.onSwipeLeft?.();
      }
    }
    // Vertical swipe (dominant direction)
    else if (absY > absX && absY > threshold) {
      if (deltaY > 0) {
        handlersRef.current.onSwipeDown?.();
      } else {
        handlersRef.current.onSwipeUp?.();
      }
    }

    swipeState.current = null;
  }, [threshold, maxTime]);

  const onTouchCancel = useCallback(() => {
    swipeState.current = null;
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel,
  };
}
