"use client";

import { memo } from "react";
import { useDraggable } from "@dnd-kit/core";
import {
  MoreVertical,
  Download,
  Pencil,
  Trash2,
  FolderInput,
  Star,
  Copy,
  Share2,
} from "lucide-react";
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
  DataGridFileCard,
  SelectionCheckmark,
} from "@/components/ui/data-list";
import { FileIcon } from "@/components/shared/file-icon";
import { FileThumbnail } from "@/components/shared/file-thumbnail";
import { canHaveThumbnail } from "@/hooks/use-thumbnail";
import { SingleAvatar } from "@/components/ui/avatar-group";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  formatRelativeTime,
  truncateFileName,
} from "@/lib/formatters";
import type { Asset } from "@/types/asset";

export interface OwnerInfo {
  id: string;
  name: string;
}

interface DraggableFileItemProps {
  asset: Asset;
  onDownload: (asset: Asset) => void;
  onRename: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  onMove: (asset: Asset) => void;
  onCopy?: (asset: Asset) => void;
  onShare?: (asset: Asset) => void;
  onStar?: (asset: Asset) => void;
  onPreview?: (asset: Asset) => void;
  viewMode?: "grid" | "list";
  index?: number;
  isSelected?: boolean;
  isPendingSelection?: boolean;
  isFocused?: boolean;
  onSelect?: (
    asset: Asset,
    selected: boolean,
    shiftKey?: boolean,
    ctrlKey?: boolean,
  ) => void;
  onContextSelect?: (asset: Asset) => void;
  selectionMode?: boolean;
  selectedCount?: number;
  onBulkDownload?: () => void;
  onBulkDelete?: () => void;
  onBulkMove?: () => void;
  owner?: OwnerInfo;
  showOwner?: boolean;
}

export const DraggableFileItem = memo(function DraggableFileItem({
  asset,
  onDownload,
  onRename,
  onDelete,
  onMove,
  onCopy,
  onShare,
  onStar,
  onPreview,
  viewMode = "grid",
  isSelected = false,
  isPendingSelection = false,
  isFocused = false,
  onSelect,
  onContextSelect,
  selectedCount = 0,
  onBulkDownload,
  onBulkDelete,
  onBulkMove,
  owner,
  showOwner = false,
}: DraggableFileItemProps) {
  const isListView = viewMode === "list";

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-asset-${asset.id}`,
    data: { type: "asset", item: asset },
  });

  // Show bulk actions when multiple items are selected and this item is part of selection
  const showBulkActions = isSelected && selectedCount > 1;

  const menuItems = showBulkActions ? (
    <>
      <ContextMenuItem onClick={onBulkDownload}>
        <Download className="mr-2 h-4 w-4" />
        Download {selectedCount} items
      </ContextMenuItem>
      <ContextMenuSeparator />
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
      <ContextMenuItem onClick={() => onDownload(asset)}>
        <Download className="mr-2 h-4 w-4" />
        Download
        <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
      </ContextMenuItem>
      {onStar && (
        <ContextMenuItem onClick={() => onStar(asset)}>
          <Star
            className={cn(
              "mr-2 h-4 w-4",
              asset.isStarred && "fill-yellow-400 text-yellow-400",
            )}
          />
          {asset.isStarred ? "Remove from starred" : "Add to starred"}
          <ContextMenuShortcut>Ctrl+S</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onRename(asset)}>
        <Pencil className="mr-2 h-4 w-4" />
        Rename
        <ContextMenuShortcut>F2</ContextMenuShortcut>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => onMove(asset)}>
        <FolderInput className="mr-2 h-4 w-4" />
        Move to
        <ContextMenuShortcut>Ctrl+M</ContextMenuShortcut>
      </ContextMenuItem>
      {onCopy && (
        <ContextMenuItem onClick={() => onCopy(asset)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
      )}
      {onShare && (
        <ContextMenuItem onClick={() => onShare(asset)}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
      )}
      <ContextMenuSeparator />
      <ContextMenuItem onClick={() => onDelete(asset)} variant="destructive">
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
          className="h-9 w-9 sm:h-8 sm:w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showBulkActions ? (
          <>
            <DropdownMenuItem onClick={onBulkDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download {selectedCount} items
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBulkMove}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move {selectedCount} items
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onBulkDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete {selectedCount} items
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onClick={() => onDownload(asset)}>
              <Download className="mr-2 h-4 w-4" />
              Download
              <DropdownMenuShortcut>Ctrl+D</DropdownMenuShortcut>
            </DropdownMenuItem>
            {onStar && (
              <DropdownMenuItem onClick={() => onStar(asset)}>
                <Star
                  className={cn(
                    "mr-2 h-4 w-4",
                    asset.isStarred && "fill-yellow-400 text-yellow-400",
                  )}
                />
                {asset.isStarred ? "Remove from starred" : "Add to starred"}
                <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRename(asset)}>
              <Pencil className="mr-2 h-4 w-4" />
              Rename
              <DropdownMenuShortcut>F2</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(asset)}>
              <FolderInput className="mr-2 h-4 w-4" />
              Move to
              <DropdownMenuShortcut>Ctrl+M</DropdownMenuShortcut>
            </DropdownMenuItem>
            {onCopy && (
              <DropdownMenuItem onClick={() => onCopy(asset)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy to
                <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
              </DropdownMenuItem>
            )}
            {onShare && (
              <DropdownMenuItem onClick={() => onShare(asset)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(asset)} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Move to trash
              <DropdownMenuShortcut>Del</DropdownMenuShortcut>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Handle click for selection (supports Ctrl+Click for multi-select, Shift+Click for range)
  const handleClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on dropdown or other interactive elements
    if ((e.target as HTMLElement).closest("button")) return;

    e.stopPropagation();
    // Pass both shiftKey and ctrlKey (metaKey for Mac) for proper multi-select
    onSelect?.(asset, !isSelected, e.shiftKey, e.ctrlKey || e.metaKey);
  };

  const handleDoubleClick = () => {
    onPreview?.(asset);
  };

  // Auto-select on context menu open (Google Drive behavior)
  const handleContextMenuOpen = (open: boolean) => {
    if (open && !isSelected) {
      onContextSelect?.(asset);
    }
  };

  // List view layout
  if (isListView) {
    return (
      <ContextMenu onOpenChange={handleContextMenuOpen}>
        <ContextMenuTrigger>
          <DataListRow
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            data-item-id={`asset-${asset.id}`}
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            selected={isSelected}
            pending={isPendingSelection}
            focused={isFocused}
            dragging={isDragging}
          >
            <FileIcon mimeType={asset.mimeType} size="sm" />
            <DataListCell primary title={asset.name}>
              {/* Mobile: Show truncated name */}
              <p className="sm:hidden font-medium text-sm text-foreground">
                {truncateFileName(asset.name, 28)}
              </p>
              {/* Desktop: Show full name with CSS truncation */}
              <p className="hidden sm:block truncate font-medium text-sm text-foreground">
                {asset.name}
              </p>
            </DataListCell>
            {showOwner && owner && (
              <DataListCell width="w-10" align="center" hideBelow="sm">
                <SingleAvatar user={owner} size="sm" />
              </DataListCell>
            )}
            <DataListCell
              width="w-24"
              align="right"
              hideBelow="sm"
              className="text-sm text-muted-foreground"
            >
              {formatFileSize(asset.size)}
            </DataListCell>
            <DataListCell
              width="w-32"
              align="right"
              hideBelow="md"
              className="text-sm text-muted-foreground"
            >
              {formatRelativeTime(new Date(asset.createdAt))}
            </DataListCell>
            <DataListCell width="w-8" align="right">
              {dropdownMenu}
            </DataListCell>
          </DataListRow>
        </ContextMenuTrigger>
        <ContextMenuContent>{menuItems}</ContextMenuContent>
      </ContextMenu>
    );
  }

  // Grid view layout
  return (
    <ContextMenu onOpenChange={handleContextMenuOpen}>
      <ContextMenuTrigger>
        <DataGridFileCard
          ref={setNodeRef}
          {...attributes}
          {...listeners}
          data-item-id={`asset-${asset.id}`}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          selected={isSelected}
          pending={isPendingSelection}
          focused={isFocused}
          dragging={isDragging}
        >
          {/* Preview area */}
          <div className="relative aspect-4/3 rounded-t-xl bg-muted/50 overflow-hidden">
            {/* Thumbnail or file icon centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              {canHaveThumbnail(asset.mimeType) ? (
                <FileThumbnail
                  assetId={asset.id}
                  mimeType={asset.mimeType}
                  thumbnailKey={asset.thumbnailKey}
                  name={asset.name}
                  size="lg"
                  className="w-full h-full rounded-none"
                />
              ) : (
                <FileIcon mimeType={asset.mimeType} size="xl" />
              )}
            </div>

            {/* Star indicator */}
            {asset.isStarred && (
              <div className="absolute top-2 left-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
              </div>
            )}

            {/* Dropdown menu */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {dropdownMenu}
            </div>

            {/* Selection checkmark */}
            {isSelected && (
              <SelectionCheckmark className="absolute bottom-2 right-2" />
            )}
          </div>

          {/* Info area */}
          <div className="p-3">
            <p
              className="truncate font-medium text-sm text-foreground mb-1"
              title={asset.name}
            >
              {asset.name}
            </p>
            <div className="flex items-center justify-between">
              {showOwner && owner ? (
                <div className="flex items-center gap-1.5 min-w-0">
                  <SingleAvatar user={owner} size="xs" showTooltip={false} />
                  <span className="text-xs text-muted-foreground truncate">
                    {owner.name}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(asset.size)}
                </span>
              )}
            </div>
          </div>
        </DataGridFileCard>
      </ContextMenuTrigger>
      <ContextMenuContent>{menuItems}</ContextMenuContent>
    </ContextMenu>
  );
});
