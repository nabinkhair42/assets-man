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
}

export function DraggableFolderItem({
  folder,
  onOpen,
  onRename,
  onDelete,
  onMove,
}: DraggableFolderItemProps) {
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

  return (
    <div ref={setDroppableRef}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            ref={setDraggableRef}
            {...attributes}
            {...listeners}
            className={cn(
              "group flex cursor-grab items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:bg-accent",
              isDragging && "opacity-50 cursor-grabbing",
              isOver && "ring-2 ring-primary bg-primary/10"
            )}
            onDoubleClick={() => onOpen(folder.id)}
          >
            <FolderIcon className="h-10 w-10 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium">{folder.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(folder.createdAt).toLocaleDateString()}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
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
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    </div>
  );
}
