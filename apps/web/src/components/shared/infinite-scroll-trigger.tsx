"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface InfiniteScrollTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}

export function InfiniteScrollTrigger({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: InfiniteScrollTriggerProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
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

  if (!hasNextPage && !isFetchingNextPage) return null;

  return (
    <div ref={loadMoreRef} className="w-full py-4 flex justify-center">
      {isFetchingNextPage && (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
