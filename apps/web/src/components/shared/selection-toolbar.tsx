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
  selectedItems: SelectedItem[];
  onClearSelection: () => void;
  onDelete: () => void;
  onMove: () => void;
  onDownload: () => void;
  className?: string;
}

export function SelectionToolbar({
  selectedItems,
  onClearSelection,
  onDelete,
  onMove,
  onDownload,
  className,
}: SelectionToolbarProps) {
  const count = selectedItems.length;
  const hasAssets = selectedItems.some((item) => item.type === "asset");

  if (count === 0) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 rounded-lg",
        "bg-card border border-border shadow-lg",
        className
      )}
    >
      <div className="flex items-center gap-2 pr-2 border-r border-border">
        <Button variant="ghost" size="icon-sm" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium whitespace-nowrap">
          {count} selected
        </span>
      </div>

      <div className="flex items-center gap-1">
        {hasAssets && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onMove} className="gap-2">
          <FolderInput className="h-4 w-4" />
          <span className="hidden sm:inline">Move</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>
  );
}
