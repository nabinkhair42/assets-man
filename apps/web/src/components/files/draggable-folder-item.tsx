"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Folder as FolderIcon, MoreVertical, Pencil, Trash2, FolderInput, Star, Copy, Share2 } from "lucide-react";
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
import { SingleAvatar } from "@/components/ui/avatar-group";
import { cn } from "@/lib/utils";
import { formatRelativeTime, truncateFileName } from "@/lib/formatters";
import type { Folder } from "@/types";

export interface OwnerInfo {
  id: string;
  name: string;
}

interface DraggableFolderItemProps {
  folder: Folder;
  onOpen: (folderId: string) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
  onCopy?: (folder: Folder) => void;
  onShare?: (folder: Folder) => void;
  onStar?: (folder: Folder) => void;
  viewMode?: "grid" | "list";
  index?: number;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (folder: Folder, selected: boolean, shiftKey?: boolean) => void;
  selectionMode?: boolean;
  selectedCount?: number;
  onBulkDelete?: () => void;
  onBulkMove?: () => void;
  owner?: OwnerInfo;
  showOwner?: boolean;
}

export function DraggableFolderItem({
  folder,
  onOpen,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onStar,
  viewMode = "grid",
  isSelected = false,
  isPendingSelection = false,
  onSelect,
  selectedCount = 0,
  onBulkDelete,
  onBulkMove,
  owner,
  showOwner = false,
}: DraggableFolderItemProps) {
  const isListView = viewMode === "list";

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `draggable-folder-${folder.id}`,
    data: { type: "folder", item: folder },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  // Show bulk actions when multiple items are selected and this item is part of selection
  const showBulkActions = isSelected && selectedCount > 1;

  const menuItems = showBulkActions ? (
    <>
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
      <ContextMenuItem onClick={() => onOpen(folder.id)}>
        <FolderIcon className="mr-2 h-4 w-4" />
        Open
        <ContextMenuShortcut>Enter</ContextMenuShortcut>
      </ContextMenuItem>
      {onStar && (
        <ContextMenuItem onClick={() => onStar(folder)}>
          <Star className={cn("mr-2 h-4 w-4", folder.isStarred && "fill-yellow-400 text-yellow-400")} />
          {folder.isStarred ? "Remove from starred" : "Add to starred"}
          <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onRename(folder)}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
        <ContextMenuShortcut>F2</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onMove(folder)}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move to
        <ContextMenuShortcut>Ctrl+M</ContextMenuShortcut>
      </ContextMenuItem>
      {onCopy && (
        <ContextMenuItem onClick={() => onCopy(folder)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      {onShare && (
        <ContextMenuItem onClick={() => onShare(folder)}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onDelete(folder)} variant="destructive">
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
        <DropdownMenuItem onClick={() => onOpen(folder.id)}>
          <FolderIcon className="mr-2 h-4 w-4" />
          Open
        </DropdownMenuItem>
        {onStar && (
          <DropdownMenuItem onClick={() => onStar(folder)}>
            <Star className={cn("mr-2 h-4 w-4", folder.isStarred && "fill-yellow-400 text-yellow-400")} />
            {folder.isStarred ? "Unstar" : "Star"}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onRename(folder)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(folder)}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move
        </DropdownMenuItem>
        {onCopy && (
          <DropdownMenuItem onClick={() => onCopy(folder)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy
          </DropdownMenuItem>
        )}
        {onShare && (
          <DropdownMenuItem onClick={() => onShare(folder)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onDelete(folder)} className="text-destructive focus:text-destructive">
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
    onSelect?.(folder, !isSelected, e.shiftKey);
  };

  // Auto-select on context menu open (Google Drive behavior)
  const handleContextMenuOpen = (open: boolean) => {
    if (open && !isSelected) {
      onSelect?.(folder, true);
    }
  };

  // List view layout
  if (isListView) {
    return (
      <div ref={setDroppableRef}>
        <ContextMenu onOpenChange={handleContextMenuOpen}>
          <ContextMenuTrigger>
            <div
              ref={setDraggableRef}
              {...attributes}
              {...listeners}
              data-item-id={`folder-${folder.id}`}
              onClick={handleClick}
              onDoubleClick={() => onOpen(folder.id)}
              className={cn(
                "group flex cursor-pointer items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-all duration-150",
                "hover:bg-accent/50 rounded-lg",
                isDragging && "opacity-50 cursor-grabbing",
                isOver && "ring-2 ring-primary bg-primary/10",
                isPendingSelection && "bg-primary/20 ring-2 ring-primary ring-inset",
                isSelected && "bg-primary/15 ring-2 ring-primary/60 ring-inset"
              )}
            >
              <FileIcon isFolder size="sm" />
              <div className="flex-1 min-w-0" title={folder.name}>
                {/* Mobile: Show truncated name */}
                <p className="sm:hidden font-medium text-sm text-foreground">
                  {truncateFileName(folder.name, 28, true)}
                </p>
                {/* Desktop: Show full name with CSS truncation */}
                <p className="hidden sm:block truncate font-medium text-sm text-foreground">
                  {folder.name}
                </p>
              </div>
              {showOwner && owner && (
                <div className="w-10 hidden sm:flex items-center justify-center">
                  <SingleAvatar user={owner} size="sm" />
                </div>
              )}
              <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">—</div>
              <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
                {formatRelativeTime(new Date(folder.createdAt))}
              </div>
              <div className="w-8 flex justify-end">{dropdownMenu}</div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>{menuItems}</ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }

  // Grid view layout
  return (
    <div ref={setDroppableRef}>
      <ContextMenu onOpenChange={handleContextMenuOpen}>
        <ContextMenuTrigger>
          <div
            ref={setDraggableRef}
            {...attributes}
            {...listeners}
            data-item-id={`folder-${folder.id}`}
            onClick={handleClick}
            onDoubleClick={() => onOpen(folder.id)}
            className={cn(
              "group relative cursor-pointer rounded-lg bg-card p-4 transition-all duration-150",
              "hover:bg-accent/50",
              isDragging && "opacity-50 scale-105",
              isOver && "ring-2 ring-primary bg-primary/10",
              isPendingSelection && "bg-primary/20 ring-2 ring-primary",
              isSelected && "bg-primary/15 ring-2 ring-primary/60"
            )}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {dropdownMenu}
            </div>
            <div className="flex justify-center mb-3">
              <FileIcon isFolder size="lg" />
            </div>
            <p className="truncate font-medium text-sm text-foreground text-center mb-1">{folder.name}</p>
            {showOwner && owner ? (
              <div className="flex items-center justify-center gap-1.5">
                <SingleAvatar user={owner} size="sm" showTooltip={false} />
                <p className="text-xs text-muted-foreground truncate max-w-16">{owner.name}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">Folder</p>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
