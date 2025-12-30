"use client";

import { cn } from "@/lib/utils";

interface LoadingPreviewProps {
  className?: string;
  message?: string;
}

export function LoadingPreview({ className, message = "Loading preview..." }: LoadingPreviewProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-border" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
      </div>
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}
