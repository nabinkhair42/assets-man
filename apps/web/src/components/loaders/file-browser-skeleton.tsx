import { Skeleton } from "@/components/ui/skeleton";

interface FileBrowserSkeletonProps {
  viewMode: "grid" | "list";
  count?: number;
}

export function FileBrowserSkeleton({ viewMode, count = 8 }: FileBrowserSkeletonProps) {
  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/60 bg-card p-4"
          >
            {/* Icon skeleton */}
            <div className="flex justify-center mb-3">
              <Skeleton className="h-14 w-14 rounded-xl" />
            </div>
            {/* Name skeleton */}
            <Skeleton className="h-4 w-3/4 mx-auto mb-1" />
            {/* Metadata skeleton */}
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    );
  }

  // List view
  return (
    <div className="flex flex-col">
      {/* List header skeleton */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60 mb-1">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24 hidden sm:block" />
        <Skeleton className="h-4 w-32 hidden md:block" />
        <Skeleton className="h-4 w-10" />
      </div>
      {/* List items */}
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3 border-b border-border/40"
        >
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24 hidden sm:block" />
          <Skeleton className="h-4 w-32 hidden md:block" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}
