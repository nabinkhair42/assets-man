"use client";

import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/shared";
import {
  DataListRow,
  DataListCell,
  DataGridFileCard,
  SelectionCheckmark,
} from "@/components/ui/data-list";
import { formatFileSize, formatRelativeTime, truncateFileName } from "@/lib/formatters";

export interface ReadOnlyAsset {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  thumbnailKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface ReadOnlyFileItemProps {
  asset: ReadOnlyAsset;
  onDownload: (asset: ReadOnlyAsset) => void;
  onPreview?: (asset: ReadOnlyAsset) => void;
  viewMode?: "grid" | "list";
  isDownloading?: boolean;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (asset: ReadOnlyAsset, selected: boolean, shiftKey?: boolean) => void;
  selectionMode?: boolean;
}

export function ReadOnlyFileItem({
  asset,
  onDownload,
  onPreview,
  viewMode = "grid",
  isDownloading = false,
  isSelected = false,
  isPendingSelection = false,
  onSelect,
  selectionMode = false,
}: ReadOnlyFileItemProps) {
  const isListView = viewMode === "list";

  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on download button
    if ((e.target as HTMLElement).closest("button")) return;

    if (onSelect) {
      e.stopPropagation();
      onSelect(asset, !isSelected, e.shiftKey);
    }
  };

  const handleDoubleClick = () => {
    onPreview?.(asset);
  };

  const handleDownloadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(asset);
  };

  // List view layout - matches DraggableFileItem
  if (isListView) {
    return (
      <DataListRow
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        selected={isSelected}
        pending={isPendingSelection}
        data-item-id={`asset-${asset.id}`}
      >
        <FileIcon mimeType={asset.mimeType} size="sm" />
        <DataListCell primary title={asset.name}>
          {/* Mobile: Show truncated name */}
          <p className="sm:hidden font-medium text-sm text-foreground">
            {truncateFileName(asset.name, 28)}
          </p>
          {/* Desktop: Show full name with CSS truncation */}
          <p className="hidden sm:block truncate font-medium text-sm text-foreground">
            {asset.name}
          </p>
        </DataListCell>
        <DataListCell width="w-24" align="right" hideBelow="sm" className="text-sm text-muted-foreground">
          {formatFileSize(asset.size)}
        </DataListCell>
        {asset.updatedAt && (
          <DataListCell width="w-32" align="right" hideBelow="md" className="text-sm text-muted-foreground">
            {formatRelativeTime(new Date(asset.updatedAt))}
          </DataListCell>
        )}
        <DataListCell width="w-8" align="right">
          <Button
            variant="ghost"
            size="icon-sm"
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
        </DataListCell>
      </DataListRow>
    );
  }

  // Grid view layout - matches DraggableFileItem
  return (
    <DataGridFileCard
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      selected={isSelected}
      pending={isPendingSelection}
      data-item-id={`asset-${asset.id}`}
    >
      {/* Preview area */}
      <div className="relative aspect-[4/3] rounded-t-xl bg-muted/50 overflow-hidden">
        {/* File icon centered - no authenticated thumbnail fetching in public share */}
        <div className="absolute inset-0 flex items-center justify-center">
          <FileIcon mimeType={asset.mimeType} size="xl" />
        </div>

        {/* Download button */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="secondary"
            size="icon-sm"
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

        {/* Selection checkmark */}
        {isSelected && (
          <SelectionCheckmark className="absolute bottom-2 right-2" />
        )}
      </div>

      {/* Info area */}
      <div className="p-3">
        <p className="truncate font-medium text-sm text-foreground mb-1" title={asset.name}>
          {asset.name}
        </p>
        <span className="text-xs text-muted-foreground">{formatFileSize(asset.size)}</span>
      </div>
    </DataGridFileCard>
  );
}
