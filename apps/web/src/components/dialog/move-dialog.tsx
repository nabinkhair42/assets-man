"use client";

import { useState, useMemo, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFolders, useMoveFolder, useUpdateAsset } from "@/hooks";
import { toast } from "sonner";
import { Folder as FolderIcon, ChevronRight, ChevronDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder, Asset } from "@/types";

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Folder | Asset | null;
  itemType: "folder" | "asset";
}

function getParentId(item: Folder | Asset | null, itemType: "folder" | "asset"): string | null {
  if (!item) return null;
  return itemType === "folder" ? (item as Folder).parentId : (item as Asset).folderId;
}

export function MoveDialog({ open, onOpenChange, item, itemType }: MoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const { data: allFolders = [] } = useFolders();
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();
  const prevOpenRef = useRef(open);

  const currentParentId = getParentId(item, itemType);

  // Reset selection when dialog opens (state sync during render, not in effect)
  if (open && !prevOpenRef.current && item) {
    setSelectedFolderId(currentParentId);
  }
  prevOpenRef.current = open;

  // Get IDs to exclude (the item itself and its descendants for folders)
  const excludeIds = useMemo(() => {
    if (!item || itemType !== "folder") return new Set<string>();

    const ids = new Set<string>([item.id]);

    function addDescendants(parentId: string) {
      allFolders.forEach((f) => {
        if (f.parentId === parentId && !ids.has(f.id)) {
          ids.add(f.id);
          addDescendants(f.id);
        }
      });
    }

    addDescendants(item.id);
    return ids;
  }, [item, itemType, allFolders]);

  const handleMove = () => {
    if (!item) return;

    // Don't move if destination is the same as current location
    if (selectedFolderId === currentParentId) {
      toast.info("Item is already in this location");
      return;
    }

    const label = itemType === "folder" ? "Folder" : "File";

    if (itemType === "folder") {
      moveFolder.mutate(
        { id: item.id, input: { parentId: selectedFolderId } },
        {
          onSuccess: () => {
            toast.success(`${label} moved`);
            onOpenChange(false);
          },
          onError: () => {
            toast.error(`Failed to move ${label.toLowerCase()}`);
          },
        }
      );
    } else {
      updateAsset.mutate(
        { id: item.id, input: { folderId: selectedFolderId } },
        {
          onSuccess: () => {
            toast.success(`${label} moved`);
            onOpenChange(false);
          },
          onError: () => {
            toast.error(`Failed to move ${label.toLowerCase()}`);
          },
        }
      );
    }
  };

  const isPending = moveFolder.isPending || updateAsset.isPending;
  const label = itemType === "folder" ? "Folder" : "File";

  // Build tree of root-level folders
  const rootFolders = allFolders.filter((f) => f.parentId === null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {label}</DialogTitle>
          <DialogDescription>
            Select a destination folder for &quot;{item?.name}&quot;.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[300px] border rounded-md p-2">
          {/* Root option */}
          <button
            type="button"
            onClick={() => setSelectedFolderId(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent text-left",
              selectedFolderId === null && "bg-accent"
            )}
          >
            <Home className="h-4 w-4" />
            <span>My Files</span>
            {currentParentId === null && (
              <span className="text-xs text-muted-foreground ml-auto">(current)</span>
            )}
          </button>

          {/* Folder tree */}
          {rootFolders.map((folder) => (
            <FolderTreeNode
              key={folder.id}
              folder={folder}
              allFolders={allFolders}
              depth={0}
              selectedId={selectedFolderId}
              currentParentId={currentParentId}
              excludeIds={excludeIds}
              onSelect={setSelectedFolderId}
            />
          ))}
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isPending || selectedFolderId === currentParentId}>
            {isPending ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface FolderTreeNodeProps {
  folder: Folder;
  allFolders: Folder[];
  depth: number;
  selectedId: string | null;
  currentParentId: string | null;
  excludeIds: Set<string>;
  onSelect: (id: string) => void;
}

function FolderTreeNode({
  folder,
  allFolders,
  depth,
  selectedId,
  currentParentId,
  excludeIds,
  onSelect,
}: FolderTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const isExcluded = excludeIds.has(folder.id);
  const hasChildren = children.length > 0;
  const isCurrent = currentParentId === folder.id;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded text-sm",
          !isExcluded && "hover:bg-accent cursor-pointer",
          selectedId === folder.id && "bg-accent",
          isExcluded && "opacity-50 cursor-not-allowed"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => !isExcluded && onSelect(folder.id)}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0.5 hover:bg-accent rounded"
          >
            {expanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <FolderIcon className="h-4 w-4 text-blue-500" />
        <span className="truncate">{folder.name}</span>
        {isCurrent && (
          <span className="text-xs text-muted-foreground ml-auto">(current)</span>
        )}
      </div>

      {expanded &&
        children.map((child) => (
          <FolderTreeNode
            key={child.id}
            folder={child}
            allFolders={allFolders}
            depth={depth + 1}
            selectedId={selectedId}
            currentParentId={currentParentId}
            excludeIds={excludeIds}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
