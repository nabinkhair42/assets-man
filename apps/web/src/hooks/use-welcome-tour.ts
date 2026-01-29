"use client";

import { useState, useEffect } from "react";
import { safeGetItem, safeSetItem, safeRemoveItem } from "@/lib/safe-storage";

const STORAGE_KEY = "assets-man-welcome-tour-completed";

export function useWelcomeTour() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if tour has been completed
    const completed = safeGetItem(STORAGE_KEY);
    if (!completed) {
      setShowTour(true);
    }
    setIsLoading(false);
  }, []);

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
    isLoading,
    completeTour,
    skipTour,
    restartTour,
  };
}
