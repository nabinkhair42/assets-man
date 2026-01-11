"use client";

import { useCallback, useEffect, useRef } from "react";

export interface NavigableItem {
  id: string;
  type: "folder" | "asset";
}

interface UseKeyboardNavigationOptions {
  /** List of navigable items in order */
  items: NavigableItem[];
  /** Currently focused item ID (format: "folder-{id}" or "asset-{id}") */
  focusedId: string | null;
  /** Callback when focus changes */
  onFocusChange: (id: string | null) => void;
  /** Callback when Enter is pressed on focused item */
  onOpen?: (item: NavigableItem) => void;
  /** Callback when Space is pressed to toggle selection */
  onSelect?: (item: NavigableItem) => void;
  /** Whether navigation is enabled */
  enabled?: boolean;
  /** Container ref for scroll management */
  containerRef?: React.RefObject<HTMLElement>;
}

/**
 * Hook for keyboard navigation in file/folder lists
 * Supports arrow keys, Enter to open, Space to select
 */
export function useKeyboardNavigation({
  items,
  focusedId,
  onFocusChange,
  onOpen,
  onSelect,
  enabled = true,
  containerRef,
}: UseKeyboardNavigationOptions) {
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Register an item element for scroll management
  const registerItem = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  }, []);

  // Get current focused index
  const getFocusedIndex = useCallback(() => {
    if (!focusedId) return -1;
    return items.findIndex((item) => `${item.type}-${item.id}` === focusedId);
  }, [items, focusedId]);

  // Scroll focused item into view
  const scrollIntoView = useCallback((id: string) => {
    const element = itemRefs.current.get(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, []);

  // Navigate to next/previous item
  const navigate = useCallback((direction: "up" | "down" | "home" | "end") => {
    if (items.length === 0) return;

    const currentIndex = getFocusedIndex();
    let newIndex: number;

    switch (direction) {
      case "up":
        newIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
        break;
      case "down":
        newIndex = currentIndex >= items.length - 1 ? 0 : currentIndex + 1;
        break;
      case "home":
        newIndex = 0;
        break;
      case "end":
        newIndex = items.length - 1;
        break;
    }

    const newItem = items[newIndex];
    if (newItem) {
      const newId = `${newItem.type}-${newItem.id}`;
      onFocusChange(newId);
      scrollIntoView(newId);
    }
  }, [items, getFocusedIndex, onFocusChange, scrollIntoView]);

  // Handle keyboard events
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          navigate("up");
          break;

        case "ArrowDown":
          e.preventDefault();
          navigate("down");
          break;

        case "Home":
          e.preventDefault();
          navigate("home");
          break;

        case "End":
          e.preventDefault();
          navigate("end");
          break;

        case "Enter":
          if (focusedId) {
            e.preventDefault();
            const item = items.find((i) => `${i.type}-${i.id}` === focusedId);
            if (item && onOpen) {
              onOpen(item);
            }
          }
          break;

        case " ": // Space
          if (focusedId) {
            e.preventDefault();
            const item = items.find((i) => `${i.type}-${i.id}` === focusedId);
            if (item && onSelect) {
              onSelect(item);
            }
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, navigate, focusedId, items, onOpen, onSelect]);

  // Focus first item if none focused and items exist
  const focusFirst = useCallback(() => {
    if (items.length > 0 && !focusedId) {
      const firstItem = items[0];
      onFocusChange(`${firstItem.type}-${firstItem.id}`);
    }
  }, [items, focusedId, onFocusChange]);

  // Clear focus
  const clearFocus = useCallback(() => {
    onFocusChange(null);
  }, [onFocusChange]);

  return {
    registerItem,
    navigate,
    focusFirst,
    clearFocus,
    focusedIndex: getFocusedIndex(),
  };
}
