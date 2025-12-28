"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface MarqueeRect {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface UseMarqueeSelectionOptions<T> {
  items: T[];
  getItemId: (item: T) => string;
  onSelectionChange: (selectedIds: string[]) => void;
  containerRef: React.RefObject<HTMLElement | null>;
  itemSelector: string;
  disabled?: boolean;
}

export function useMarqueeSelection<T>({
  items,
  getItemId,
  onSelectionChange,
  containerRef,
  itemSelector,
  disabled = false,
}: UseMarqueeSelectionOptions<T>) {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(new Set());
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const scrollOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getScrollableParent = useCallback((element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;

    // Check for radix scroll area viewport
    const viewport = element.querySelector("[data-radix-scroll-area-viewport]");
    if (viewport) return viewport as HTMLElement;

    return element;
  }, []);

  // Calculate intersecting items for a given rect
  const calculateIntersectingItems = useCallback(
    (rect: MarqueeRect): string[] => {
      const container = containerRef.current;
      if (!container) return [];

      const scrollableParent = getScrollableParent(container);
      const containerRect = container.getBoundingClientRect();
      const currentScrollX = scrollableParent?.scrollLeft ?? 0;
      const currentScrollY = scrollableParent?.scrollTop ?? 0;

      const left = Math.min(rect.startX, rect.endX);
      const right = Math.max(rect.startX, rect.endX);
      const top = Math.min(rect.startY, rect.endY);
      const bottom = Math.max(rect.startY, rect.endY);

      const itemElements = container.querySelectorAll(itemSelector);
      const intersectingIds: string[] = [];

      itemElements.forEach((element) => {
        const itemRect = element.getBoundingClientRect();

        // Convert item rect to container-relative coordinates with scroll
        const itemLeft = itemRect.left - containerRect.left + currentScrollX;
        const itemRight = itemRect.right - containerRect.left + currentScrollX;
        const itemTop = itemRect.top - containerRect.top + currentScrollY;
        const itemBottom = itemRect.bottom - containerRect.top + currentScrollY;

        // Check for intersection
        const intersects =
          itemLeft < right &&
          itemRight > left &&
          itemTop < bottom &&
          itemBottom > top;

        if (intersects) {
          const itemId = element.getAttribute("data-item-id");
          if (itemId) {
            intersectingIds.push(itemId);
          }
        }
      });

      return intersectingIds;
    },
    [containerRef, itemSelector, getScrollableParent]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      // Only start marquee selection on left click
      if (e.button !== 0) return;

      // Don't start if clicking on an interactive element
      const target = e.target as HTMLElement;
      if (
        target.closest("button") ||
        target.closest("input") ||
        target.closest("[role='menuitem']") ||
        target.closest("[data-draggable]") ||
        target.closest(itemSelector)
      ) {
        return;
      }

      const container = containerRef.current;
      if (!container) return;

      const scrollableParent = getScrollableParent(container);
      const rect = container.getBoundingClientRect();

      // Store scroll offset at start
      scrollOffset.current = {
        x: scrollableParent?.scrollLeft ?? 0,
        y: scrollableParent?.scrollTop ?? 0,
      };

      const x = e.clientX - rect.left + scrollOffset.current.x;
      const y = e.clientY - rect.top + scrollOffset.current.y;

      startPoint.current = { x, y };
      setIsSelecting(true);
      setMarqueeRect({ startX: x, startY: y, endX: x, endY: y });
      setPendingSelection(new Set());

      e.preventDefault();
    },
    [disabled, containerRef, itemSelector, getScrollableParent]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isSelecting || !startPoint.current || !containerRef.current) return;

      const container = containerRef.current;
      const scrollableParent = getScrollableParent(container);
      const rect = container.getBoundingClientRect();

      // Get current scroll offset
      const currentScrollX = scrollableParent?.scrollLeft ?? 0;
      const currentScrollY = scrollableParent?.scrollTop ?? 0;

      const x = e.clientX - rect.left + currentScrollX;
      const y = e.clientY - rect.top + currentScrollY;

      const newRect = {
        startX: startPoint.current.x,
        startY: startPoint.current.y,
        endX: x,
        endY: y,
      };

      setMarqueeRect(newRect);

      // Calculate and update pending selection in real-time
      const intersecting = calculateIntersectingItems(newRect);
      setPendingSelection(new Set(intersecting));
    },
    [isSelecting, containerRef, getScrollableParent, calculateIntersectingItems]
  );

  const handleMouseUp = useCallback(() => {
    if (!isSelecting || !marqueeRect || !containerRef.current) {
      setIsSelecting(false);
      setMarqueeRect(null);
      setPendingSelection(new Set());
      startPoint.current = null;
      return;
    }

    // Check if the marquee is too small (just a click)
    const width = Math.abs(marqueeRect.endX - marqueeRect.startX);
    const height = Math.abs(marqueeRect.endY - marqueeRect.startY);

    if (width < 5 && height < 5) {
      // Clear selection on click in empty space
      onSelectionChange([]);
      setIsSelecting(false);
      setMarqueeRect(null);
      setPendingSelection(new Set());
      startPoint.current = null;
      return;
    }

    // Apply the pending selection
    const selectedIds = calculateIntersectingItems(marqueeRect);
    onSelectionChange(selectedIds);

    setIsSelecting(false);
    setMarqueeRect(null);
    setPendingSelection(new Set());
    startPoint.current = null;
  }, [isSelecting, marqueeRect, containerRef, onSelectionChange, calculateIntersectingItems]);

  // Add global mouse event listeners when selecting
  useEffect(() => {
    if (isSelecting) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isSelecting, handleMouseMove, handleMouseUp]);

  // Calculate the visual rectangle for rendering
  const visualRect = marqueeRect
    ? {
        left: Math.min(marqueeRect.startX, marqueeRect.endX),
        top: Math.min(marqueeRect.startY, marqueeRect.endY),
        width: Math.abs(marqueeRect.endX - marqueeRect.startX),
        height: Math.abs(marqueeRect.endY - marqueeRect.startY),
      }
    : null;

  return {
    isSelecting,
    marqueeRect: visualRect,
    pendingSelection,
    handleMouseDown,
  };
}
