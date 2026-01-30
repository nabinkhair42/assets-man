"use client";

import { useStorageStats } from "@/hooks/use-storage";
import { HardDrive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function StorageIndicator() {
  const { data: stats, isLoading, error } = useStorageStats();
  const { state } = useSidebar();

  // Skeleton loading state
  if (isLoading) {
    return (
      <div className="px-3 py-2 group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
          <HardDrive className="size-4 shrink-0 opacity-50" />
          <Skeleton className="h-4 w-14 group-data-[collapsible=icon]:hidden" />
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-1.5 w-full rounded-full mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return null;
  }

  const { usedPercentage, formattedUsed, formattedLimit } = stats;

  // Determine color based on usage
  const getProgressColor = () => {
    if (usedPercentage >= 90) return "bg-destructive";
    if (usedPercentage >= 75) return "bg-amber-500";
    return "bg-primary";
  };

  const content = (
    <div className="px-3 py-2 group-data-[collapsible=icon]:px-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
        <HardDrive className="size-4 shrink-0" />
        <span className="group-data-[collapsible=icon]:hidden">Storage</span>
      </div>
      <div className="group-data-[collapsible=icon]:hidden">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1">
          <div
            className={cn("h-full transition-all duration-300", getProgressColor())}
            style={{ width: `${Math.min(100, usedPercentage)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {formattedUsed} of {formattedLimit} used
        </p>
      </div>
    </div>
  );

  if (state === "collapsed") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" align="center">
          {formattedUsed}/{formattedLimit}
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
}
