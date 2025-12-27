"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  endMessage?: string;
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  endMessage = "No more items",
}: InfiniteScrollTriggerProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          // Defer to avoid synchronous setState within effect
          requestAnimationFrame(() => {
            fetchNextPage();
          });
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(currentRef);

    return () => {
      observer.unobserve(currentRef);
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div ref={loadMoreRef} className="w-full py-2 flex justify-center">
      {isFetchingNextPage && (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
      {!hasNextPage && (
        <p className="text-sm text-muted-foreground">{endMessage}</p>
      )}
    </div>
  );
}
