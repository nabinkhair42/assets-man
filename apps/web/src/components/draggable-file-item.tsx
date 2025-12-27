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
  viewMode?: "grid" | "list";
  index?: number;
}

function getFileIconData(mimeType: string) {
  if (mimeType.startsWith("image/")) return { icon: FileImage, color: "text-pink-500", bg: "bg-pink-500/10" };
  if (mimeType.startsWith("video/")) return { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-500/10" };
  if (mimeType.startsWith("audio/")) return { icon: FileAudio, color: "text-orange-500", bg: "bg-orange-500/10" };
  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("text")
  )
    return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (
    mimeType.includes("zip") ||
    mimeType.includes("rar") ||
    mimeType.includes("archive")
  )
    return { icon: FileArchive, color: "text-amber-500", bg: "bg-amber-500/10" };
  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
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

export function DraggableFileItem({
  asset,
  onDownload,
  onRename,
  onDelete,
  onMove,
  viewMode = "grid",
  index = 0,
}: DraggableFileItemProps) {
  const { icon: Icon, color, bg } = getFileIconData(asset.mimeType);
  const isListView = viewMode === "list";

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
              "hover:bg-accent/50 border-b border-border/40",
              isDragging && "opacity-50 cursor-grabbing bg-primary/10"
            )}
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate font-medium text-sm text-foreground">{asset.name}</p>
            </div>
            <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
              {formatFileSize(asset.size)}
            </div>
            <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
              {formatRelativeTime(new Date(asset.createdAt))}
            </div>
            <div className="w-10 flex justify-end">
              {dropdownMenu}
            </div>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    );
  }

  // Grid view layout (original)
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          className={cn(
            "group flex cursor-grab items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-accent hover:shadow-soft hover:border-primary/20",
            isDragging && "opacity-50 cursor-grabbing scale-105"
          )}
        >
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-lg", bg)}>
            <Icon className={cn("h-6 w-6", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-foreground">{asset.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFileSize(asset.size)} •{" "}
              {formatRelativeTime(new Date(asset.createdAt))}
            </p>
          </div>
          {dropdownMenu}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>{menuItems}</ContextMenuContent>
    </ContextMenu>
  );
}
