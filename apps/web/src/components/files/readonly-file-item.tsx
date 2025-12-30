"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/shared";
import { cn } from "@/lib/utils";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";

export interface ReadOnlyAsset {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt?: string;
  updatedAt?: string;
}

interface ReadOnlyFileItemProps {
  asset: ReadOnlyAsset;
  onDownload: (asset: ReadOnlyAsset) => void;
  onPreview?: (asset: ReadOnlyAsset) => void;
  viewMode?: "grid" | "list";
  isDownloading?: boolean;
}

export function ReadOnlyFileItem({
  asset,
  onDownload,
  onPreview,
  viewMode = "grid",
  isDownloading = false,
}: ReadOnlyFileItemProps) {
  const isListView = viewMode === "list";

  const handleClick = () => {
    onPreview?.(asset);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(asset);
  };

  // List view layout
  if (isListView) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex cursor-pointer items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-all duration-150",
          "hover:bg-accent/50 rounded-lg"
        )}
      >
        <FileIcon mimeType={asset.mimeType} size="sm" />
        <div className="flex-1 min-w-0" title={asset.name}>
          <p className="truncate font-medium text-sm text-foreground">
            {asset.name}
          </p>
        </div>
        <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
          {formatFileSize(asset.size)}
        </div>
        {asset.updatedAt && (
          <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
            {formatRelativeTime(new Date(asset.updatedAt))}
          </div>
        )}
        <div className="w-8 flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleDownloadClick}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // Grid view layout
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-transparent transition-all duration-200",
        "hover:border-border/60 hover:shadow-lg hover:shadow-black/5"
      )}
    >
      {/* Preview area */}
      <div className="relative aspect-[4/3] rounded-t-xl bg-muted/50 overflow-hidden">
        {/* File icon centered */}
        <div className="absolute inset-0 flex items-center justify-center">
          <FileIcon mimeType={asset.mimeType} size="xl" />
        </div>

        {/* Download button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md bg-background/90 hover:bg-background"
            onClick={handleDownloadClick}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="truncate font-medium text-sm text-foreground mb-1" title={asset.name}>
          {asset.name}
        </p>
        <span className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</span>
      </div>
    </div>
  );
}
