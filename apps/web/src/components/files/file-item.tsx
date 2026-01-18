"use client";

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
import type { Asset } from "@/types";

interface FileItemProps {
  asset: Asset;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
}

function getFileIconData(mimeType: string) {
  if (mimeType.startsWith("image/"))
    return { icon: FileImage, color: "text-pink-500", bg: "bg-pink-500/10" };
  if (mimeType.startsWith("video/"))
    return {
      icon: FileVideo,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    };
  if (mimeType.startsWith("audio/"))
    return {
      icon: FileAudio,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    };
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
    return {
      icon: FileArchive,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    };
  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" };
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export function FileItem({
  asset,
  onDownload,
  onRename,
  onDelete,
  onMove,
}: FileItemProps) {
  const { icon: Icon, color, bg } = getFileIconData(asset.mimeType);

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
        <div className="group flex cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:bg-accent/50 hover:border-primary/30">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg}`}
          >
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-foreground">
              {asset.name}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatFileSize(asset.size)} •{" "}
              {new Date(asset.createdAt).toLocaleDateString()}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                tooltipContent="More"
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
