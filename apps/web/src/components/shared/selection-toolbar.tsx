"use client";

import { X, Trash2, FolderInput, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SelectedItem {
  id: string;
  type: "folder" | "asset";
  name: string;
}

interface SelectionToolbarProps {
  selectedItems: Map<string, SelectedItem> | SelectedItem[];
  onClearSelection: () => void;
  onDelete?: () => void;
  onMove?: () => void;
  onBulkDownload?: () => void;
  onDownload?: () => void;
  variant?: "default" | "readonly";
  className?: string;
}

export function SelectionToolbar({
  selectedItems,
  onClearSelection,
  onDelete,
  onMove,
  onBulkDownload,
  onDownload,
  variant = "default",
  className,
}: SelectionToolbarProps) {
  // Handle both Map and array formats
  const items = selectedItems instanceof Map
    ? Array.from(selectedItems.values())
    : selectedItems;
  const count = items.length;
  const hasAssets = items.some((item) => item.type === "asset");

  if (count === 0) return null;

  const downloadHandler = onBulkDownload ?? onDownload;
  const isReadonly = variant === "readonly";

  return (
    <div
      className={cn(
        "fixed bottom-20 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-background/30 backdrop-blur-2xl rounded-xl border border-border/50",
        className
      )}
    >
      <div className="flex items-center gap-2 pr-2 border-r">
        <Button variant="ghost" size="icon-sm" onClick={onClearSelection} className="rounded-full">
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium whitespace-nowrap">
          {count} selected
        </span>
      </div>

      <div className="flex items-center gap-1">
        {hasAssets && downloadHandler && (
          <Button
            variant="ghost"
            size="sm"
            onClick={downloadHandler}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        )}
        {!isReadonly && onMove && (
          <Button variant="ghost" size="sm" onClick={onMove} className="gap-2">
            <FolderInput className="h-4 w-4" />
            <span className="hidden sm:inline">Move</span>
          </Button>
        )}
        {!isReadonly && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
}
