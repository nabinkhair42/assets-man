"use client";

import { useState, useCallback, useEffect } from "react";

interface UseFocusManagerOptions {
  /** Clear focus when clicking outside */
  clearOnOutsideClick?: boolean;
  /** Clear focus on Escape key */
  clearOnEscape?: boolean;
  /** Container ref for outside click detection */
  containerRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook for managing focus state in file browser
 * Tracks which item is focused for keyboard navigation
 */
export function useFocusManager(options: UseFocusManagerOptions = {}) {
  const {
    clearOnOutsideClick = true,
    clearOnEscape = true,
    containerRef,
  } = options;

  const [focusedId, setFocusedId] = useState<string | null>(null);

  // Handle outside click to clear focus
  useEffect(() => {
    if (!clearOnOutsideClick) return;

    const handleClick = (e: MouseEvent) => {
      // If clicking outside the container, clear focus
      if (containerRef?.current && !containerRef.current.contains(e.target as Node)) {
        setFocusedId(null);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [clearOnOutsideClick, containerRef]);

  // Handle Escape to clear focus
  useEffect(() => {
    if (!clearOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedId) {
        setFocusedId(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [clearOnEscape, focusedId]);

  const focus = useCallback((id: string) => {
    setFocusedId(id);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusedId(null);
  }, []);

  const isFocused = useCallback((id: string) => {
    return focusedId === id;
  }, [focusedId]);

  return {
    focusedId,
    setFocusedId,
    focus,
    clearFocus,
    isFocused,
  };
}
