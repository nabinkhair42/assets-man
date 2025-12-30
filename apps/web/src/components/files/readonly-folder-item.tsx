"use client";

import { Folder as FolderIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/formatters";

export interface ReadOnlyFolder {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ReadOnlyFolderItemProps {
  folder: ReadOnlyFolder;
  onOpen: (folderId: string) => void;
  viewMode?: "grid" | "list";
}

export function ReadOnlyFolderItem({
  folder,
  onOpen,
  viewMode = "grid",
}: ReadOnlyFolderItemProps) {
  const isListView = viewMode === "list";

  const handleClick = () => {
    onOpen(folder.id);
  };

  // List view layout
  if (isListView) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex cursor-pointer items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-all duration-150",
          "hover:bg-accent/50 rounded-lg"
        )}
      >
        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <FolderIcon className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0" title={folder.name}>
          <p className="truncate font-medium text-sm text-foreground">
            {folder.name}
          </p>
        </div>
        <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">—</div>
        {folder.updatedAt && (
          <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
            {formatRelativeTime(new Date(folder.updatedAt))}
          </div>
        )}
        <div className="w-8 flex justify-end">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Grid view layout - Compact horizontal card (Google Drive style)
  return (
    <div
      onClick={handleClick}
      className={cn(
        "group relative cursor-pointer rounded-lg border border-border/40 bg-card transition-all duration-150",
        "hover:border-border hover:bg-accent/30"
      )}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Folder icon */}
        <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
          <FolderIcon className="h-5 w-5 text-blue-500" />
        </div>

        {/* Name */}
        <span className="flex-1 truncate text-sm font-medium" title={folder.name}>
          {folder.name}
        </span>

        {/* Arrow indicator on hover */}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      </div>
    </div>
  );
}
