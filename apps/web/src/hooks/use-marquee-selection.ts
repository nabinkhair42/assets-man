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
  /** Distance from edge to trigger auto-scroll (default: 60px) */
  autoScrollThreshold?: number;
  /** Maximum scroll speed in pixels per frame (default: 15) */
  autoScrollSpeed?: number;
}

export function useMarqueeSelection<T>({
  items,
  getItemId,
  onSelectionChange,
  containerRef,
  itemSelector,
  disabled = false,
  autoScrollThreshold = 60,
  autoScrollSpeed = 15,
}: UseMarqueeSelectionOptions<T>) {
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [pendingSelection, setPendingSelection] = useState<Set<string>>(() => new Set());
  const startPoint = useRef<{ x: number; y: number } | null>(null);
  const scrollOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Auto-scroll refs
  const autoScrollAnimationRef = useRef<number | null>(null);
  const lastMousePosition = useRef<{ clientX: number; clientY: number } | null>(null);

  // Use ref to track isSelecting for animation loop (avoids stale closure)
  const isSelectingRef = useRef(false);

  // Store handlers in refs to avoid re-subscribing event listeners on every render
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>(() => {});
  const handleMouseUpRef = useRef<() => void>(() => {});

  const getScrollableParent = useCallback((element: HTMLElement | null): HTMLElement | null => {
    if (!element) return null;

    // Check for radix scroll area viewport - traverse UP the DOM tree
    const viewport = element.closest("[data-radix-scroll-area-viewport]");
    if (viewport) return viewport as HTMLElement;

    // Fallback: check if element itself or a child has the viewport
    const childViewport = element.querySelector("[data-radix-scroll-area-viewport]");
    if (childViewport) return childViewport as HTMLElement;

    // Last fallback: find any scrollable parent
    let current: HTMLElement | null = element.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      if (
        (style.overflowY === "auto" || style.overflowY === "scroll") &&
        current.scrollHeight > current.clientHeight
      ) {
        return current;
      }
      current = current.parentElement;
    }

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

  // Stop auto-scroll animation
  const stopAutoScroll = useCallback(() => {
    if (autoScrollAnimationRef.current !== null) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }
  }, []);

  // Calculate scroll velocity based on mouse position relative to container edges
  const calculateScrollVelocity = useCallback(
    (clientX: number, clientY: number, viewportRect: DOMRect) => {
      let scrollX = 0;
      let scrollY = 0;

      // Calculate distance from edges
      const distanceFromTop = clientY - viewportRect.top;
      const distanceFromBottom = viewportRect.bottom - clientY;
      const distanceFromLeft = clientX - viewportRect.left;
      const distanceFromRight = viewportRect.right - clientX;

      // Vertical scrolling
      if (distanceFromTop < autoScrollThreshold && distanceFromTop >= 0) {
        // Near top edge - scroll up
        const intensity = 1 - distanceFromTop / autoScrollThreshold;
        scrollY = -autoScrollSpeed * intensity;
      } else if (distanceFromBottom < autoScrollThreshold && distanceFromBottom >= 0) {
        // Near bottom edge - scroll down
        const intensity = 1 - distanceFromBottom / autoScrollThreshold;
        scrollY = autoScrollSpeed * intensity;
      }

      // Horizontal scrolling
      if (distanceFromLeft < autoScrollThreshold && distanceFromLeft >= 0) {
        // Near left edge - scroll left
        const intensity = 1 - distanceFromLeft / autoScrollThreshold;
        scrollX = -autoScrollSpeed * intensity;
      } else if (distanceFromRight < autoScrollThreshold && distanceFromRight >= 0) {
        // Near right edge - scroll right
        const intensity = 1 - distanceFromRight / autoScrollThreshold;
        scrollX = autoScrollSpeed * intensity;
      }

      return { scrollX, scrollY };
    },
    [autoScrollThreshold, autoScrollSpeed]
  );

  // Auto-scroll animation loop
  const performAutoScroll = useCallback(() => {
    const container = containerRef.current;
    // Use ref for isSelecting to avoid stale closure in animation loop
    if (!container || !isSelectingRef.current || !lastMousePosition.current || !startPoint.current) {
      stopAutoScroll();
      return;
    }

    const scrollableParent = getScrollableParent(container);
    if (!scrollableParent) {
      stopAutoScroll();
      return;
    }

    const viewportRect = scrollableParent.getBoundingClientRect();
    const { clientX, clientY } = lastMousePosition.current;

    const { scrollX, scrollY } = calculateScrollVelocity(clientX, clientY, viewportRect);

    // Only scroll if there's velocity
    if (scrollX !== 0 || scrollY !== 0) {
      const prevScrollTop = scrollableParent.scrollTop;
      const prevScrollLeft = scrollableParent.scrollLeft;

      // Perform the scroll
      scrollableParent.scrollTop += scrollY;
      scrollableParent.scrollLeft += scrollX;

      // Check if scroll actually happened
      const scrolledY = scrollableParent.scrollTop - prevScrollTop;
      const scrolledX = scrollableParent.scrollLeft - prevScrollLeft;

      // Update the marquee rect if scroll happened
      if (scrolledX !== 0 || scrolledY !== 0) {
        const containerRect = container.getBoundingClientRect();
        const currentScrollX = scrollableParent.scrollLeft;
        const currentScrollY = scrollableParent.scrollTop;

        const x = clientX - containerRect.left + currentScrollX;
        const y = clientY - containerRect.top + currentScrollY;

        const newRect = {
          startX: startPoint.current.x,
          startY: startPoint.current.y,
          endX: x,
          endY: y,
        };

        setMarqueeRect(newRect);

        // Update pending selection
        const intersecting = calculateIntersectingItems(newRect);
        setPendingSelection(new Set(intersecting));
      }
    }

    // Continue the animation loop
    autoScrollAnimationRef.current = requestAnimationFrame(performAutoScroll);
  }, [
    containerRef,
    getScrollableParent,
    calculateScrollVelocity,
    calculateIntersectingItems,
    stopAutoScroll,
  ]);

  // Start auto-scroll when needed
  const startAutoScroll = useCallback(() => {
    if (autoScrollAnimationRef.current === null) {
      autoScrollAnimationRef.current = requestAnimationFrame(performAutoScroll);
    }
  }, [performAutoScroll]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      // Disable marquee on touch devices to prevent conflict with scroll
      if (window.matchMedia("(pointer: coarse)").matches) return;

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
      isSelectingRef.current = true;
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

      // Store mouse position for auto-scroll
      lastMousePosition.current = { clientX: e.clientX, clientY: e.clientY };

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

      // Start auto-scroll if near edges
      startAutoScroll();
    },
    [isSelecting, containerRef, getScrollableParent, calculateIntersectingItems, startAutoScroll]
  );

  const handleMouseUp = useCallback(() => {
    // Stop auto-scroll
    stopAutoScroll();
    lastMousePosition.current = null;
    isSelectingRef.current = false;

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
  }, [isSelecting, marqueeRect, containerRef, onSelectionChange, calculateIntersectingItems, stopAutoScroll]);

  // Keep handler refs up to date without causing effect re-subscriptions
  handleMouseMoveRef.current = handleMouseMove;
  handleMouseUpRef.current = handleMouseUp;

  // Add global mouse event listeners when selecting
  // Use stable ref-based handlers so this effect only re-subscribes when isSelecting changes
  useEffect(() => {
    if (isSelecting) {
      const onMouseMove = (e: MouseEvent) => handleMouseMoveRef.current(e);
      const onMouseUp = () => handleMouseUpRef.current();

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);

      return () => {
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
        stopAutoScroll();
      };
    }
  }, [isSelecting, stopAutoScroll]);

  // Cleanup auto-scroll on unmount
  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

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
