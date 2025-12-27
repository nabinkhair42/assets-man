"use client";

import { useDraggable } from "@dnd-kit/core";
import { MoreVertical, Download, Pencil, Trash2, FolderInput } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
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
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
import type { Asset } from "@/types";

interface DraggableFileItemProps {
  asset: Asset;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
  viewMode?: "grid" | "list";
  index?: number;
}

export function DraggableFileItem({
  asset,
  onDownload,
  onRename,
  onDelete,
  onMove,
  viewMode = "grid",
}: DraggableFileItemProps) {
  const isListView = viewMode === "list";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-asset-${asset.id}`,
    data: { type: "asset", item: asset },
  });

  const menuItems = (
    <>
      <ContextMenuItem onClick={() => onDownload(asset)}>
        <Download className="mr-2 h-4 w-4" />
        Download
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onRename(asset)}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onMove(asset)}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onDelete(asset)} className="text-destructive focus:text-destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
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

  // List view layout
  if (isListView) {
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
              "group flex cursor-grab items-center gap-3 px-4 py-3 transition-all duration-150",
              "hover:bg-accent/50 rounded",
              isDragging && "opacity-50 cursor-grabbing bg-primary/10"
            )}
          >
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
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={cn(
            "group relative cursor-grab rounded bg-card p-4 transition-all duration-200 hover:bg-accent/50",
            isDragging && "opacity-50 cursor-grabbing scale-105"
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
