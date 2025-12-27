"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { Folder as FolderIcon, MoreVertical, Pencil, Trash2, FolderInput } from "lucide-react";
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
import { formatRelativeTime } from "@/lib/formatters";
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

export function DraggableFolderItem({
  folder,
  onOpen,
  onRename,
  onDelete,
  onMove,
  viewMode = "grid",
}: DraggableFolderItemProps) {
  const isListView = viewMode === "list";

  const { attributes, listeners, setNodeRef: setDraggableRef, isDragging } = useDraggable({
    id: `draggable-folder-${folder.id}`,
    data: { type: "folder", item: folder },
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
      <ContextMenuItem onClick={() => onDelete(folder)} className="text-destructive focus:text-destructive">
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
          tooltipContent="More"
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
        <DropdownMenuItem onClick={() => onDelete(folder)} className="text-destructive focus:text-destructive">
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
                "hover:bg-accent/50 rounded",
                isDragging && "opacity-50 cursor-grabbing bg-primary/10",
                isOver && "ring-2 ring-primary bg-primary/10"
              )}
              onDoubleClick={() => onOpen(folder.id)}
            >
              <FileIcon isFolder size="sm" />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-sm text-foreground">{folder.name}</p>
              </div>
              <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">—</div>
              <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
                {formatRelativeTime(new Date(folder.createdAt))}
              </div>
              <div className="w-10 flex justify-end">{dropdownMenu}</div>
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
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={setDraggableRef}
            {...attributes}
            {...listeners}
            className={cn(
              "group relative cursor-grab rounded bg-card p-4 transition-all duration-200 hover:bg-accent/50",
              isDragging && "opacity-50 cursor-grabbing scale-105",
              isOver && "ring-2 ring-primary bg-primary/10"
            )}
            onDoubleClick={() => onOpen(folder.id)}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {dropdownMenu}
            </div>
            <div className="flex justify-center mb-3">
              <FileIcon isFolder size="lg" />
            </div>
            <p className="truncate font-medium text-sm text-foreground text-center mb-1">{folder.name}</p>
            <p className="text-xs text-muted-foreground text-center">Folder</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
