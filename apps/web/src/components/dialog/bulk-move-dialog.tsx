"use client";

import { useState, useMemo } from "react";
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
import type { Folder } from "@/types";
import type { SelectedItem } from "@/components/shared";

interface BulkMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SelectedItem[];
  onSuccess?: () => void;
}

export function BulkMoveDialog({ open, onOpenChange, items, onSuccess }: BulkMoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const { data: allFolders = [] } = useFolders();
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();

  const folderCount = items.filter((i) => i.type === "folder").length;
  const assetCount = items.filter((i) => i.type === "asset").length;

  // Get IDs to exclude (folders being moved and their descendants)
  const excludeIds = useMemo(() => {
    const folderItems = items.filter((i) => i.type === "folder");
    const ids = new Set<string>(folderItems.map((i) => i.id));

    function addDescendants(parentId: string) {
      allFolders.forEach((f) => {
        if (f.parentId === parentId && !ids.has(f.id)) {
          ids.add(f.id);
          addDescendants(f.id);
        }
      });
    }

    folderItems.forEach((item) => addDescendants(item.id));
    return ids;
  }, [items, allFolders]);

  const handleMove = async () => {
    if (items.length === 0) return;

    setIsMoving(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Moving ${items.length} items`);

    for (const item of items) {
      try {
        if (item.type === "folder") {
          await new Promise<void>((resolve, reject) => {
            moveFolder.mutate(
              { id: item.id, input: { parentId: selectedFolderId } },
              {
                onSuccess: () => resolve(),
                onError: () => reject(),
              }
            );
          });
        } else {
          await new Promise<void>((resolve, reject) => {
            updateAsset.mutate(
              { id: item.id, input: { folderId: selectedFolderId } },
              {
                onSuccess: () => resolve(),
                onError: () => reject(),
              }
            );
          });
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsMoving(false);

    if (failCount === 0) {
      toast.success(`Moved ${successCount} items`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`Failed to move items`, { id: toastId });
    } else {
      toast.warning(`Moved ${successCount} items, ${failCount} failed`, { id: toastId });
    }

    onOpenChange(false);
    onSuccess?.();
  };

  // Build tree of root-level folders
  const rootFolders = allFolders.filter((f) => f.parentId === null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {items.length} Items</DialogTitle>
          <DialogDescription>
            Select a destination folder for {folderCount > 0 && `${folderCount} folder${folderCount !== 1 ? "s" : ""}`}
            {folderCount > 0 && assetCount > 0 && " and "}
            {assetCount > 0 && `${assetCount} file${assetCount !== 1 ? "s" : ""}`}.
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
          </button>

          {/* Folder tree */}
          {rootFolders.map((folder) => (
            <FolderTreeNode
              key={folder.id}
              folder={folder}
              allFolders={allFolders}
              depth={0}
              selectedId={selectedFolderId}
              excludeIds={excludeIds}
              onSelect={setSelectedFolderId}
            />
          ))}
        </ScrollArea>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isMoving}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving ? "Moving..." : "Move Here"}
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
  excludeIds: Set<string>;
  onSelect: (id: string) => void;
}

function FolderTreeNode({
  folder,
  allFolders,
  depth,
  selectedId,
  excludeIds,
  onSelect,
}: FolderTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const children = allFolders.filter((f) => f.parentId === folder.id);
  const isExcluded = excludeIds.has(folder.id);
  const hasChildren = children.length > 0;

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
      </div>

      {expanded &&
        children.map((child) => (
          <FolderTreeNode
            key={child.id}
            folder={child}
            allFolders={allFolders}
            depth={depth + 1}
            selectedId={selectedId}
            excludeIds={excludeIds}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}
