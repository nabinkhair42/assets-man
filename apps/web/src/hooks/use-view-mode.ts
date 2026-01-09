"use client";

import { useState, useEffect, useCallback } from "react";

const VIEW_MODE_KEY = "assets-view-mode";

type ViewMode = "grid" | "list";

export function useViewMode(defaultMode: ViewMode = "grid") {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultMode);
  const [isHydrated, setIsHydrated] = useState(false);

  // Read from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list") {
      setViewModeState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Persist to localStorage when changed
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  return {
    viewMode,
    setViewMode,
    isHydrated,
  };
}
