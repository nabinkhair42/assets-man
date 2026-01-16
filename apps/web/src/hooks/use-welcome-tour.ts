"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "assets-man-welcome-tour-completed";

export function useWelcomeTour() {
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if tour has been completed
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShowTour(true);
    }
    setIsLoading(false);
  }, []);

  const completeTour = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShowTour(false);
  };

  const restartTour = () => {
    localStorage.removeItem(STORAGE_KEY);
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
