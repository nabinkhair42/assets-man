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
import { Checkbox } from "@/components/ui/checkbox";
import { FileIcon } from "@/components/shared";
import { cn } from "@/lib/utils";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
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
  onSelect,
  selectionMode = false,
  selectedCount = 0,
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
}: DraggableFileItemProps) {
  const isListView = viewMode === "list";
  const showCheckbox = selectionMode || isSelected;

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
          className={cn("h-8 w-8 transition-opacity", isListView ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-100")}
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

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Capture shiftKey and toggle selection
    const newChecked = !isSelected;
    onSelect?.(asset, newChecked, e.shiftKey);
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
            className={cn(
              "group flex cursor-grab items-center gap-3 px-4 py-3 transition-all duration-150",
              "hover:bg-accent/50 rounded",
              isDragging && "opacity-50 cursor-grabbing bg-primary/10",
              isSelected && "bg-primary/10"
            )}
          >
            <div
              className={cn(
                "flex items-center justify-center w-5 transition-opacity cursor-pointer",
                showCheckbox ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={handleCheckboxClick}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Checkbox
                checked={isSelected}
                className="pointer-events-none"
              />
            </div>
            <FileIcon mimeType={asset.mimeType} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm text-foreground">{asset.name}</p>
            </div>
            <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
              {formatFileSize(asset.size)}
            </div>
            <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
              {formatRelativeTime(new Date(asset.createdAt))}
            </div>
            <div className="w-10 flex justify-end">{dropdownMenu}</div>
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
          className={cn(
            "group relative cursor-grab rounded bg-card p-4 transition-all duration-200 hover:bg-accent/50",
            isDragging && "opacity-50 cursor-grabbing scale-105",
            isSelected && "ring-2 ring-primary bg-primary/10"
          )}
        >
          <div
            className={cn(
              "absolute top-2 left-2 transition-opacity cursor-pointer",
              showCheckbox ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onClick={handleCheckboxClick}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              className="pointer-events-none"
            />
          </div>
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
