"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useThumbnail, canHaveThumbnail } from "@/hooks/use-thumbnail";
import { FileIcon } from "./file-icon";
import { ThumbnailSkeleton } from "@/components/loaders/thumbnail-skeleton";

interface FileThumbnailProps {
  assetId: string;
  mimeType: string;
  thumbnailKey?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "w-10 h-10",
  md: "w-16 h-16",
  lg: "w-24 h-24",
};

export function FileThumbnail({
  assetId,
  mimeType,
  thumbnailKey,
  name,
  size = "md",
  className,
  showFallback = true,
}: FileThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  const { thumbnailUrl, isLoading, isGenerating } = useThumbnail({
    assetId,
    mimeType,
    thumbnailKey,
    autoGenerate: true,
  });

  const canShowThumbnail = canHaveThumbnail(mimeType);
  const shouldShowImage = thumbnailUrl && !imageError;

  // If we can't have a thumbnail, show the file icon
  if (!canShowThumbnail) {
    if (!showFallback) return null;
    return (
      <FileIcon
        mimeType={mimeType}
        className={cn(sizeClasses[size], className)}
      />
    );
  }

  // Loading state - use skeleton for better visual feedback
  if (isLoading || isGenerating) {
    // For full-width thumbnails (like in grid cards), use the size class from parent
    if (className?.includes("w-full") || className?.includes("h-full")) {
      return <ThumbnailSkeleton size="full" className={className} />;
    }
    return <ThumbnailSkeleton size={size} className={className} />;
  }

  // Show thumbnail image if available
  if (shouldShowImage) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          sizeClasses[size],
          className,
        )}
      >
        <Image
          src={thumbnailUrl}
          alt={name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized // Since these are presigned URLs
        />
      </div>
    );
  }

  // Fallback to file icon
  if (showFallback) {
    return (
      <FileIcon
        mimeType={mimeType}
        className={cn(sizeClasses[size], className)}
      />
    );
  }

  return null;
}

// Simple thumbnail display without auto-generation (for performance in lists)
interface SimpleThumbnailProps {
  thumbnailUrl?: string | null;
  mimeType: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SimpleThumbnail({
  thumbnailUrl,
  mimeType,
  name,
  size = "md",
  className,
}: SimpleThumbnailProps) {
  const [imageError, setImageError] = useState(false);

  if (thumbnailUrl && !imageError) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-lg bg-muted",
          sizeClasses[size],
          className,
        )}
      >
        <Image
          src={thumbnailUrl}
          alt={name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          unoptimized
        />
      </div>
    );
  }

  return (
    <FileIcon
      mimeType={mimeType}
      className={cn(sizeClasses[size], className)}
    />
  );
}
