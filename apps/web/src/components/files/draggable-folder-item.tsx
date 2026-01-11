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
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  DataListRow,
  DataListCell,
  DataGridFolderCard,
  SelectionCheckmark,
} from "@/components/ui/data-list";
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
  isFocused?: boolean;
  onSelect?: (folder: Folder, selected: boolean, shiftKey?: boolean, ctrlKey?: boolean) => void;
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
  isFocused = false,
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
          className="h-6 w-6 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
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
          <DropdownMenuShortcut>Enter</DropdownMenuShortcut>
        </DropdownMenuItem>
        {onStar && (
          <DropdownMenuItem onClick={() => onStar(folder)}>
            <Star className={cn("mr-2 h-4 w-4", folder.isStarred && "fill-yellow-400 text-yellow-400")} />
            {folder.isStarred ? "Remove from starred" : "Add to starred"}
            <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onRename(folder)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
          <DropdownMenuShortcut>F2</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(folder)}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move to
          <DropdownMenuShortcut>Ctrl+M</DropdownMenuShortcut>
        </DropdownMenuItem>
        {onCopy && (
          <DropdownMenuItem onClick={() => onCopy(folder)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy to
            <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
          </DropdownMenuItem>
        )}
        {onShare && (
          <DropdownMenuItem onClick={() => onShare(folder)}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(folder)} variant="destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Move to trash
          <DropdownMenuShortcut>Del</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Handle click for selection (supports Ctrl+Click for multi-select, Shift+Click for range)
  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on dropdown, name link, or other interactive elements
    if ((e.target as HTMLElement).closest("button")) return;
    if ((e.target as HTMLElement).closest("[data-folder-name]")) return;

    e.stopPropagation();
    // Pass both shiftKey and ctrlKey (metaKey for Mac) for proper multi-select
    onSelect?.(folder, !isSelected, e.shiftKey, e.ctrlKey || e.metaKey);
  };

  // Handle click on folder name - opens folder directly (Google Drive behavior)
  const handleNameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onOpen(folder.id);
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
            <DataListRow
              ref={setDraggableRef}
              {...attributes}
              {...listeners}
              data-item-id={`folder-${folder.id}`}
              onClick={handleClick}
              onDoubleClick={() => onOpen(folder.id)}
              selected={isSelected}
              pending={isPendingSelection}
              focused={isFocused}
              dragging={isDragging}
              dropTarget={isOver}
            >
              <FileIcon isFolder size="sm" />
              <DataListCell primary title={folder.name}>
                {/* Mobile: Show truncated name - clickable to open */}
                <button
                  type="button"
                  data-folder-name
                  onClick={handleNameClick}
                  className="sm:hidden font-medium text-sm text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left truncate max-w-full"
                >
                  {truncateFileName(folder.name, 28, true)}
                </button>
                {/* Desktop: Show full name - clickable to open */}
                <button
                  type="button"
                  data-folder-name
                  onClick={handleNameClick}
                  className="hidden sm:block truncate font-medium text-sm text-foreground hover:text-primary hover:underline underline-offset-2 transition-colors text-left max-w-full"
                >
                  {folder.name}
                </button>
              </DataListCell>
              {showOwner && owner && (
                <DataListCell width="w-10" align="center" hideBelow="sm">
                  <SingleAvatar user={owner} size="sm" />
                </DataListCell>
              )}
              <DataListCell width="w-24" align="right" hideBelow="sm" className="text-sm text-muted-foreground">
                —
              </DataListCell>
              <DataListCell width="w-32" align="right" hideBelow="md" className="text-sm text-muted-foreground">
                {formatRelativeTime(new Date(folder.createdAt))}
              </DataListCell>
              <DataListCell width="w-8" align="right">
                {dropdownMenu}
              </DataListCell>
            </DataListRow>
          </ContextMenuTrigger>
          <ContextMenuContent>{menuItems}</ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }

  // Grid view layout - Compact horizontal card (Google Drive style)
  return (
    <div ref={setDroppableRef}>
      <ContextMenu onOpenChange={handleContextMenuOpen}>
        <ContextMenuTrigger>
          <DataGridFolderCard
            ref={setDraggableRef}
            {...attributes}
            {...listeners}
            data-item-id={`folder-${folder.id}`}
            onClick={handleClick}
            onDoubleClick={() => onOpen(folder.id)}
            selected={isSelected}
            pending={isPendingSelection}
            focused={isFocused}
            dragging={isDragging}
            dropTarget={isOver}
          >
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2.5">
              {/* Folder icon */}
              <div className="relative shrink-0">
                <FolderIcon className="h-5 w-5 text-muted-foreground" />
                {folder.isStarred && (
                  <Star className="absolute -top-1 -right-1 h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                )}
              </div>

              {/* Name - clickable to open folder directly */}
              <button
                type="button"
                data-folder-name
                onClick={handleNameClick}
                className="flex-1 min-w-0 truncate text-sm font-medium text-left hover:text-primary hover:underline underline-offset-2 transition-colors"
                title={folder.name}
              >
                {folder.name}
              </button>

              {/* Selection checkmark or menu - fixed height container to prevent layout shift */}
              <div className="shrink-0 h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center">
                {isSelected ? (
                  <SelectionCheckmark className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {dropdownMenu}
                  </div>
                )}
              </div>
            </div>

            {/* Drop indicator overlay */}
            {isOver && (
              <div className="absolute inset-0 rounded-lg flex items-center justify-center bg-primary/10 backdrop-blur-[1px]">
                <span className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium">
                  Drop here
                </span>
              </div>
            )}
          </DataGridFolderCard>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
