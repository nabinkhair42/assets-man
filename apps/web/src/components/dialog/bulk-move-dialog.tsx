"use client";

import { memo, useState, useMemo } from "react";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
  ResponsiveDialogBody,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFolders, useMoveFolder } from "@/hooks/use-folders";
import { useUpdateAsset } from "@/hooks/use-assets";
import { toast } from "sonner";
import {
  Folder as FolderIcon,
  ChevronRight,
  ChevronDown,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Folder } from "@/types/folder";
import type { SelectedItem } from "@/components/shared/selection-toolbar";

interface BulkMoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: SelectedItem[];
  onSuccess?: () => void;
}

export function BulkMoveDialog({
  open,
  onOpenChange,
  items,
  onSuccess,
}: BulkMoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const { data: allFolders = [] } = useFolders();
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();

  let folderCount = 0;
  let assetCount = 0;
  for (const i of items) {
    if (i.type === "folder") folderCount++;
    else assetCount++;
  }

  // Build parent→children index for O(1) child lookups
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, Folder[]>();
    for (const f of allFolders) {
      const key = f.parentId;
      const list = map.get(key);
      if (list) list.push(f);
      else map.set(key, [f]);
    }
    return map;
  }, [allFolders]);

  // Get IDs to exclude (folders being moved and their descendants)
  const excludeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const i of items) {
      if (i.type === "folder") ids.add(i.id);
    }

    function addDescendants(parentId: string) {
      const children = childrenByParent.get(parentId);
      if (!children) return;
      for (const f of children) {
        if (!ids.has(f.id)) {
          ids.add(f.id);
          addDescendants(f.id);
        }
      }
    }

    for (const i of items) {
      if (i.type === "folder") addDescendants(i.id);
    }
    return ids;
  }, [items, childrenByParent]);

  const handleMove = async () => {
    if (items.length === 0) return;

    setIsMoving(true);
    let successCount = 0;
    let failCount = 0;

    const toastId = toast.loading(`Moving ${items.length} items`);

    const results = await Promise.allSettled(
      items.map((item) => {
        if (item.type === "folder") {
          return new Promise<void>((resolve, reject) => {
            moveFolder.mutate(
              { id: item.id, input: { parentId: selectedFolderId } },
              {
                onSuccess: () => resolve(),
                onError: () => reject(),
              },
            );
          });
        } else {
          return new Promise<void>((resolve, reject) => {
            updateAsset.mutate(
              { id: item.id, input: { folderId: selectedFolderId } },
              {
                onSuccess: () => resolve(),
                onError: () => reject(),
              },
            );
          });
        }
      })
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        successCount++;
      } else {
        failCount++;
      }
    }

    setIsMoving(false);

    if (failCount === 0) {
      toast.success(`Moved ${successCount} items`, { id: toastId });
    } else if (successCount === 0) {
      toast.error(`Failed to move items`, { id: toastId });
    } else {
      toast.warning(`Moved ${successCount}, failed to move ${failCount}`, {
        id: toastId,
      });
    }

    onOpenChange(false);
    onSuccess?.();
  };

  const rootFolders = childrenByParent.get(null) ?? [];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            Move {items.length} Items
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Select a destination folder for{" "}
            {folderCount > 0 &&
              `${folderCount} folder${folderCount !== 1 ? "s" : ""}`}
            {folderCount > 0 && assetCount > 0 && " and "}
            {assetCount > 0 &&
              `${assetCount} file${assetCount !== 1 ? "s" : ""}`}
            .
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <ResponsiveDialogBody>
          <ScrollArea className="h-75 border rounded-md p-2">
            {/* Root option */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent text-left",
                selectedFolderId === null && "bg-accent",
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
                childrenByParent={childrenByParent}
                depth={0}
                selectedId={selectedFolderId}
                excludeIds={excludeIds}
                onSelect={setSelectedFolderId}
              />
            ))}
          </ScrollArea>
        </ResponsiveDialogBody>

        <ResponsiveDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMoving}
          >
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving}>
            {isMoving ? "Moving..." : "Move Here"}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

interface FolderTreeNodeProps {
  folder: Folder;
  childrenByParent: Map<string | null, Folder[]>;
  depth: number;
  selectedId: string | null;
  excludeIds: Set<string>;
  onSelect: (id: string) => void;
}

const FolderTreeNode = memo(function FolderTreeNode({
  folder,
  childrenByParent,
  depth,
  selectedId,
  excludeIds,
  onSelect,
}: FolderTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);
  const children = childrenByParent.get(folder.id) ?? [];
  const isExcluded = excludeIds.has(folder.id);
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded text-sm",
          !isExcluded && "hover:bg-accent cursor-pointer",
          selectedId === folder.id && "bg-accent",
          isExcluded && "opacity-50 cursor-not-allowed",
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
            childrenByParent={childrenByParent}
            depth={depth + 1}
            selectedId={selectedId}
            excludeIds={excludeIds}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
});
