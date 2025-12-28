"use client";

import { useDraggable } from "@dnd-kit/core";
import { MoreVertical, Download, Pencil, Trash2, FolderInput, Star } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { FileIcon } from "@/components/shared";
import { cn } from "@/lib/utils";
import { formatFileSize, formatRelativeTime, truncateFileName } from "@/lib/formatters";
import type { Asset } from "@/types";

interface DraggableFileItemProps {
  asset: Asset;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
  onStar?: (asset: Asset) => void;
  viewMode?: "grid" | "list";
  index?: number;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (asset: Asset, selected: boolean, shiftKey?: boolean) => void;
  selectionMode?: boolean;
  selectedCount?: number;
  onBulkDownload?: () => void;
  onBulkDelete?: () => void;
  onBulkMove?: () => void;
}

export function DraggableFileItem({
  asset,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onStar,
  viewMode = "grid",
  isSelected = false,
  isPendingSelection = false,
  onSelect,
  selectedCount = 0,
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
}: DraggableFileItemProps) {
  const isListView = viewMode === "list";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-asset-${asset.id}`,
    data: { type: "asset", item: asset },
  });

  // Show bulk actions when multiple items are selected and this item is part of selection
  const showBulkActions = isSelected && selectedCount > 1;

  const menuItems = showBulkActions ? (
    <>
      <ContextMenuItem onClick={onBulkDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download {selectedCount} items
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onBulkMove}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move {selectedCount} items
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={onBulkDelete} variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete {selectedCount} items
      </ContextMenuItem>
    </>
  ) : (
    <>
      <ContextMenuItem onClick={() => onDownload(asset)}>
        <Download className="mr-2 h-4 w-4" />
        Download
        <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
      </ContextMenuItem>
      {onStar && (
        <ContextMenuItem onClick={() => onStar(asset)}>
          <Star className={cn("mr-2 h-4 w-4", asset.isStarred && "fill-yellow-400 text-yellow-400")} />
          {asset.isStarred ? "Remove from starred" : "Add to starred"}
          <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onRename(asset)}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
        <ContextMenuShortcut>F2</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onMove(asset)}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move to
        <ContextMenuShortcut>Ctrl+M</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onDelete(asset)} variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Move to trash
        <ContextMenuShortcut>Del</ContextMenuShortcut>
      </ContextMenuItem>
    </>
  );

  const dropdownMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onDownload(asset)}>
          <Download className="mr-2 h-4 w-4" />
          Download
        </DropdownMenuItem>
        {onStar && (
          <DropdownMenuItem onClick={() => onStar(asset)}>
            <Star className={cn("mr-2 h-4 w-4", asset.isStarred && "fill-yellow-400 text-yellow-400")} />
            {asset.isStarred ? "Unstar" : "Star"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onRename(asset)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(asset)}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(asset)} className="text-destructive focus:text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Handle click to toggle selection (Google Drive style)
  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on dropdown or other interactive elements
    if ((e.target as HTMLElement).closest("button")) return;

    e.stopPropagation();
    onSelect?.(asset, !isSelected, e.shiftKey);
  };

  // Auto-select on context menu open (Google Drive behavior)
  const handleContextMenuOpen = (open: boolean) => {
    if (open && !isSelected) {
      onSelect?.(asset, true);
    }
  };

  // List view layout
  if (isListView) {
    return (
      <ContextMenu onOpenChange={handleContextMenuOpen}>
        <ContextMenuTrigger>
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            data-item-id={`asset-${asset.id}`}
            onClick={handleClick}
            className={cn(
              "group flex cursor-pointer items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-all duration-150",
              "hover:bg-accent/50 rounded-lg",
              isDragging && "opacity-50 cursor-grabbing",
              isPendingSelection && "bg-primary/20 ring-2 ring-primary ring-inset",
              isSelected && "bg-primary/15 ring-2 ring-primary/60 ring-inset"
            )}
          >
            <FileIcon mimeType={asset.mimeType} size="sm" />
            <div className="flex-1 min-w-0" title={asset.name}>
              {/* Mobile: Show truncated name */}
              <p className="sm:hidden font-medium text-sm text-foreground">
                {truncateFileName(asset.name, 28)}
              </p>
              {/* Desktop: Show full name with CSS truncation */}
              <p className="hidden sm:block truncate font-medium text-sm text-foreground">
                {asset.name}
              </p>
            </div>
            <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
              {formatFileSize(asset.size)}
            </div>
            <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
              {formatRelativeTime(new Date(asset.createdAt))}
            </div>
            <div className="w-8 flex justify-end">{dropdownMenu}</div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    );
  }

  // Grid view layout
  return (
    <ContextMenu onOpenChange={handleContextMenuOpen}>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          data-item-id={`asset-${asset.id}`}
          onClick={handleClick}
          className={cn(
            "group relative cursor-pointer rounded-lg bg-card p-4 transition-all duration-150",
            "hover:bg-accent/50",
            isDragging && "opacity-50 scale-105",
            isPendingSelection && "bg-primary/20 ring-2 ring-primary",
            isSelected && "bg-primary/15 ring-2 ring-primary/60"
          )}
        >
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {dropdownMenu}
          </div>
          <div className="flex justify-center mb-3">
            <FileIcon mimeType={asset.mimeType} size="lg" />
          </div>
          <p className="truncate font-medium text-sm text-foreground text-center mb-1">{asset.name}</p>
          <p className="text-xs text-muted-foreground text-center">{formatFileSize(asset.size)}</p>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{menuItems}</ContextMenuContent>
    </ContextMenu>
  );
}
