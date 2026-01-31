"use client";

import { useState, useSyncExternalStore } from "react";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safe-storage";

const STORAGE_KEY = "assets-man-welcome-tour-completed";

function getTourCompleted(): boolean {
  return !!safeGetItem(STORAGE_KEY);
}

const emptySubscribe = () => () => {};

export function useWelcomeTour() {
  // Hydration-safe: server assumes tour not completed, client reads localStorage
  const tourCompleted = useSyncExternalStore(
    emptySubscribe,
    getTourCompleted,
    () => false,
  );

  const [showTour, setShowTour] = useState(!tourCompleted);

  const completeTour = () => {
    safeSetItem(STORAGE_KEY, "true");
    setShowTour(false);
  };

  const skipTour = () => {
    safeSetItem(STORAGE_KEY, "true");
    setShowTour(false);
  };

  const restartTour = () => {
    safeRemoveItem(STORAGE_KEY);
    setShowTour(true);
  };

  return {
    showTour,
    isLoading: false,
    completeTour,
    skipTour,
    restartTour,
  };
}
