"use client";

import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FileIcon } from "@/components/shared/file-icon";
import { cn } from "@/lib/utils";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
import type { TrashedItem as TrashedItemType } from "@/types/trash";

interface TrashItemProps {
  item: TrashedItemType;
  onRestore: (item: TrashedItemType) => void;
  onPermanentDelete: (item: TrashedItemType) => void;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (item: TrashedItemType, selected: boolean, shiftKey?: boolean) => void;
  selectedCount?: number;
  onBulkRestore?: () => void;
  onBulkDelete?: () => void;
}

export function TrashItem({
  item,
  onRestore,
  onPermanentDelete,
  isSelected = false,
  isPendingSelection = false,
  onSelect,
  selectedCount = 0,
  onBulkRestore,
  onBulkDelete,
}: TrashItemProps) {
  const isFolder = item.itemType === "folder";
  const trashedDate = item.trashedAt ? new Date(item.trashedAt) : new Date();
  const mimeType = (item as any).mimeType || "";

  // Show bulk actions when multiple items are selected and this item is part of selection
  const showBulkActions = isSelected && selectedCount > 1;

  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on buttons
    if ((e.target as HTMLElement).closest("button")) return;
    e.stopPropagation();
    onSelect?.(item, !isSelected, e.shiftKey);
  };

  // Auto-select on context menu open (Google Drive behavior)
  const handleContextMenuOpen = (open: boolean) => {
    if (open && !isSelected) {
      onSelect?.(item, true);
    }
  };

  const menuItems = showBulkActions ? (
    <>
      <ContextMenuItem onClick={onBulkRestore}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Restore {selectedCount} items
      </ContextMenuItem>
      <ContextMenuItem
        onClick={onBulkDelete}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete {selectedCount} items permanently
      </ContextMenuItem>
    </>
  ) : (
    <>
      <ContextMenuItem onClick={() => onRestore(item)}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Restore
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => onPermanentDelete(item)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Delete Permanently
      </ContextMenuItem>
    </>
  );

  return (
    <ContextMenu onOpenChange={handleContextMenuOpen}>
      <ContextMenuTrigger>
        <div
          data-item-id={`${item.itemType}-${item.id}`}
          onClick={handleClick}
          className={cn(
            "group flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-accent/50 rounded-lg cursor-pointer",
            isPendingSelection && "bg-primary/20 ring-2 ring-primary ring-inset",
            isSelected && "bg-primary/15 ring-2 ring-primary/60 ring-inset"
          )}
        >
          <FileIcon mimeType={mimeType} isFolder={isFolder} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-sm text-foreground">{item.name}</p>
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
            {isFolder ? "—" : formatFileSize((item as any).size || 0)}
          </div>
          <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
            {formatRelativeTime(trashedDate)}
          </div>
          <div className="w-20 flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(item);
              }}
              tooltipContent="Restore item"
              className="h-8 w-8 opacity-60 hover:opacity-100"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onPermanentDelete(item);
              }}
              className="h-8 w-8 opacity-60 hover:opacity-100 text-destructive hover:text-destructive"
              tooltipContent="Delete permanently"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{menuItems}</ContextMenuContent>
    </ContextMenu>
  );
}
