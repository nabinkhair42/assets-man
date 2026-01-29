"use client";

import { Folder as FolderIcon, ChevronRight } from "lucide-react";
import { FileIcon } from "@/components/shared/file-icon";
import {
  DataListRow,
  DataListCell,
  DataGridFolderCard,
  SelectionCheckmark,
} from "@/components/ui/data-list";
import { formatRelativeTime, truncateFileName } from "@/lib/formatters";

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
  isSelected?: boolean;
  isPendingSelection?: boolean;
  onSelect?: (
    folder: ReadOnlyFolder,
    selected: boolean,
    shiftKey?: boolean,
    ctrlKey?: boolean,
  ) => void;
  selectionMode?: boolean;
}

export function ReadOnlyFolderItem({
  folder,
  onOpen,
  viewMode = "grid",
  isSelected = false,
  isPendingSelection = false,
  onSelect,
}: ReadOnlyFolderItemProps) {
  const isListView = viewMode === "list";

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.stopPropagation();
      onSelect(folder, !isSelected, e.shiftKey, e.ctrlKey || e.metaKey);
    }
  };

  const handleDoubleClick = () => {
    onOpen(folder.id);
  };

  // List view layout - matches DraggableFolderItem
  if (isListView) {
    return (
      <DataListRow
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        selected={isSelected}
        pending={isPendingSelection}
        data-item-id={`folder-${folder.id}`}
      >
        <FileIcon isFolder size="sm" />
        <DataListCell primary title={folder.name}>
          {/* Mobile: Show truncated name */}
          <p className="sm:hidden font-medium text-sm text-foreground">
            {truncateFileName(folder.name, 28, true)}
          </p>
          {/* Desktop: Show full name with CSS truncation */}
          <p className="hidden sm:block truncate font-medium text-sm text-foreground">
            {folder.name}
          </p>
        </DataListCell>
        <DataListCell
          width="w-24"
          align="right"
          hideBelow="sm"
          className="text-sm text-muted-foreground"
        >
          —
        </DataListCell>
        {folder.updatedAt && (
          <DataListCell
            width="w-32"
            align="right"
            hideBelow="md"
            className="text-sm text-muted-foreground"
          >
            {formatRelativeTime(new Date(folder.updatedAt))}
          </DataListCell>
        )}
        <DataListCell width="w-8" align="right">
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </DataListCell>
      </DataListRow>
    );
  }

  // Grid view layout - Compact horizontal card (Google Drive style) - matches DraggableFolderItem
  return (
    <DataGridFolderCard
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      selected={isSelected}
      pending={isPendingSelection}
      data-item-id={`folder-${folder.id}`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Folder icon */}
        <FolderIcon className="h-5 w-5 text-muted-foreground shrink-0" />

        {/* Name */}
        <span
          className="flex-1 truncate text-sm font-medium"
          title={folder.name}
        >
          {folder.name}
        </span>

        {/* Selection checkmark or arrow indicator on hover */}
        {isSelected ? (
          <SelectionCheckmark />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        )}
      </div>
    </DataGridFolderCard>
  );
}
