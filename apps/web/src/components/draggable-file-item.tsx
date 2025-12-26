"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  File,
  FileImage,
  FileText,
  FileVideo,
  FileAudio,
  FileArchive,
  MoreVertical,
  Download,
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
import type { Asset } from "@/types";

interface DraggableFileItemProps {
  asset: Asset;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return FileText;
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return FileArchive;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function DraggableFileItem({
  asset,
  onDownload,
  onRename,
  onDelete,
  onMove,
}: DraggableFileItemProps) {
  const Icon = getFileIcon(asset.mimeType);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-asset-${asset.id}`,
    data: {
      type: "asset",
      item: asset,
    },
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
      <ContextMenuItem
        onClick={() => onDelete(asset)}
        className="text-destructive focus:text-destructive"
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </ContextMenuItem>
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={cn(
            "group flex cursor-grab items-center gap-3 rounded-lg border bg-card p-4 transition-all hover:bg-accent",
            isDragging && "opacity-50 cursor-grabbing"
          )}
        >
          <Icon className="h-10 w-10 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{asset.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(asset.size)} •{" "}
              {new Date(asset.createdAt).toLocaleDateString()}
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
              <DropdownMenuItem
                onClick={() => onDelete(asset)}
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
  );
}
