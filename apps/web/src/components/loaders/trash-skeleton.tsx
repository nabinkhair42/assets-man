import { Skeleton } from "@/components/ui/skeleton";

interface TrashSkeletonProps {
  count?: number;
}

export function TrashSkeleton({ count = 5 }: TrashSkeletonProps) {
  return (
    <div className="flex flex-col">
      {/* List header skeleton */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-border/60 mb-1">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24 hidden sm:block" />
        <Skeleton className="h-4 w-32 hidden md:block" />
        <Skeleton className="h-4 w-20" />
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
          <div className="w-20 flex justify-end gap-1">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
