"use client";

import { useState, useSyncExternalStore, useCallback } from "react";
import { safeGetItem, safeSetItem } from "@/lib/safe-storage";

const VIEW_MODE_KEY = "assets-view-mode";

type ViewMode = "grid" | "list";

function getStoredViewMode(): ViewMode {
  const stored = safeGetItem(VIEW_MODE_KEY);
  if (stored === "grid" || stored === "list") {
    return stored;
  }
  return "grid";
}

// Trivial subscribe — localStorage doesn't fire events in the same tab,
// so we only use this for the initial snapshot (SSR vs client).
const emptySubscribe = () => () => {};

export function useViewMode(defaultMode: ViewMode = "grid") {
  // Hydration-safe: server returns defaultMode, client reads localStorage
  const hydratedDefault = useSyncExternalStore(
    emptySubscribe,
    getStoredViewMode,
    () => defaultMode,
  );

  const [viewMode, setViewModeState] = useState<ViewMode>(hydratedDefault);

  // Persist to localStorage when changed
  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    safeSetItem(VIEW_MODE_KEY, mode);
  }, []);

  return {
    viewMode,
    setViewMode,
    isHydrated: true,
  };
}
