import { Skeleton } from "@/components/ui/skeleton";

interface FileBrowserSkeletonProps {
  viewMode: "grid" | "list";
  count?: number;
}

export function FileBrowserSkeleton({ viewMode, count = 8 }: FileBrowserSkeletonProps) {
  if (viewMode === "grid") {
    return (
      <div className="space-y-6">
        {/* Folders section */}
        <div>
          <Skeleton className="h-3.5 w-14 mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={`folder-${i}`}
                className="rounded-lg border border-border/40 bg-card"
              >
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Skeleton className="h-5 w-5 rounded shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Files section */}
        <div>
          <Skeleton className="h-3.5 w-10 mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {Array.from({ length: count }).map((_, i) => (
              <div
                key={`file-${i}`}
                className="rounded-xl border border-transparent"
              >
                {/* Preview area */}
                <div className="relative aspect-4/3 rounded-t-xl bg-muted/50 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Skeleton className="w-12 h-12 rounded-lg" />
                  </div>
                </div>
                {/* Info area */}
                <div className="p-3">
                  <Skeleton className="h-4 w-3/4 mb-1" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
