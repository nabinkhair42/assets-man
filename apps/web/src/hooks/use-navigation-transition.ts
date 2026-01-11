"use client";

import { useState, useCallback, useTransition } from "react";

interface UseNavigationTransitionOptions {
  /** Minimum duration to show loading state (prevents flash) */
  minLoadingDuration?: number;
}

/**
 * Hook for managing navigation transitions with loading states
 * Provides smooth transitions when navigating between folders
 */
export function useNavigationTransition(options: UseNavigationTransitionOptions = {}) {
  const { minLoadingDuration = 150 } = options;

  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();

  const navigate = useCallback(async <T>(
    navigationFn: () => T | Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    setIsNavigating(true);

    try {
      const result = await navigationFn();

      // Ensure minimum loading duration for smooth UX
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingDuration) {
        await new Promise((resolve) =>
          setTimeout(resolve, minLoadingDuration - elapsed)
        );
      }

      return result;
    } finally {
      setIsNavigating(false);
    }
  }, [minLoadingDuration]);

  // For synchronous state updates with React transitions
  const navigateSync = useCallback((navigationFn: () => void) => {
    setIsNavigating(true);
    startTransition(() => {
      navigationFn();
      // Small delay to show transition
      setTimeout(() => setIsNavigating(false), minLoadingDuration);
    });
  }, [minLoadingDuration]);

  return {
    isNavigating: isNavigating || isPending,
    navigate,
    navigateSync,
  };
}
