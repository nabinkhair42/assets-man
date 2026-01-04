import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ThumbnailSkeletonProps {
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
  full: "w-full h-full",
};

export function ThumbnailSkeleton({ size = "md", className }: ThumbnailSkeletonProps) {
  return (
    <div className={cn("relative overflow-hidden", sizeClasses[size], className)}>
      <Skeleton className="absolute inset-0 rounded-lg" />
      {/* Inner pulse effect for more visual interest */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="w-1/2 h-1/2 rounded-md" />
      </div>
    </div>
  );
}

// Grid file card thumbnail skeleton (matches the 4/3 aspect ratio)
export function GridThumbnailSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative aspect-[4/3] rounded-t-xl overflow-hidden", className)}>
      <Skeleton className="absolute inset-0" />
      {/* Center icon skeleton */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Skeleton className="w-16 h-16 rounded-lg" />
      </div>
    </div>
  );
}
