"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  Folder as FolderIcon,
  MoreVertical,
  Pencil,
  Trash2,
  FolderInput,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { Folder } from "@/types";

interface DraggableFolderItemProps {
  folder: Folder;
  onOpen: (folderId: string) => void;
  onRename: (folder: Folder) => void;
  onDelete: (folder: Folder) => void;
  onMove: (folder: Folder) => void;
  viewMode?: "grid" | "list";
  index?: number;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export function DraggableFolderItem({
  folder,
  onOpen,
  onRename,
  onDelete,
  onMove,
  viewMode = "grid",
  index = 0,
}: DraggableFolderItemProps) {
  const isListView = viewMode === "list";

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    isDragging,
  } = useDraggable({
    id: `draggable-folder-${folder.id}`,
    data: {
      type: "folder",
      item: folder,
    },
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `folder-${folder.id}`,
  });

  const menuItems = (
    <>
      <ContextMenuItem onClick={() => onOpen(folder.id)}>
        <FolderIcon className="mr-2 h-4 w-4" />
        Open
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onRename(folder)}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onMove(folder)}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move
      </ContextMenuItem>
      <ContextMenuItem
        onClick={() => onDelete(folder)}
        className="text-destructive focus:text-destructive"
      >
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
          className={cn(
            "h-8 w-8 transition-opacity",
            isListView ? "opacity-60 hover:opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
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
        <DropdownMenuItem onClick={() => onRename(folder)}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onMove(folder)}>
          <FolderInput className="mr-2 h-4 w-4" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onDelete(folder)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // List view layout
  if (isListView) {
    return (
      <div ref={setDroppableRef}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              ref={setDraggableRef}
              {...attributes}
              {...listeners}
              className={cn(
                "group flex cursor-grab items-center gap-3 px-4 py-3 transition-all duration-150",
                "hover:bg-accent/50 border-b border-border/40",
                isDragging && "opacity-50 cursor-grabbing bg-primary/10",
                isOver && "ring-2 ring-primary bg-primary/10"
              )}
              onDoubleClick={() => onOpen(folder.id)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                <FolderIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm text-foreground">{folder.name}</p>
              </div>
              <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
                —
              </div>
              <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
                {formatRelativeTime(new Date(folder.createdAt))}
              </div>
              <div className="w-10 flex justify-end">
                {dropdownMenu}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>{menuItems}</ContextMenuContent>
        </ContextMenu>
      </div>
    );
  }

  // Grid view layout (original)
  return (
    <div ref={setDroppableRef}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={setDraggableRef}
            {...attributes}
            {...listeners}
            className={cn(
              "group flex cursor-grab items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-accent hover:shadow-soft hover:border-primary/20",
              isDragging && "opacity-50 cursor-grabbing scale-105",
              isOver && "ring-2 ring-primary bg-primary/10 border-primary/50"
            )}
            onDoubleClick={() => onOpen(folder.id)}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <FolderIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-semibold text-foreground">{folder.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(new Date(folder.createdAt))}
              </p>
            </div>
            {dropdownMenu}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
