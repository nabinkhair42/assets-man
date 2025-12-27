"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Trash2, RotateCcw, Loader2, Folder as FolderIcon, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  useInfiniteTrash,
  useRestoreItem,
  usePermanentlyDelete,
  useEmptyTrash,
} from "@/hooks";
import { toast } from "sonner";
import type { TrashedItem } from "@/types";
import { formatDistanceToNow } from "date-fns";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function TrashBrowser() {
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data: trashData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTrash();
  const restoreItem = useRestoreItem();
  const permanentlyDelete = usePermanentlyDelete();
  const emptyTrash = useEmptyTrash();

  // Flatten paginated items
  const items = useMemo(() => {
    if (!trashData?.pages) return [];
    return trashData.pages.flatMap((page) => page.items);
  }, [trashData]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRestore = (item: TrashedItem) => {
    const toastId = toast.loading(`Restoring ${item.name}...`);
    restoreItem.mutate(
      { id: item.id, type: item.itemType },
      {
        onSuccess: () => {
          toast.success(`${item.name} restored`, { id: toastId });
        },
        onError: () => {
          toast.error(`Failed to restore ${item.name}`, { id: toastId });
        },
      }
    );
  };

  const handlePermanentDelete = (item: TrashedItem) => {
    const toastId = toast.loading(`Deleting ${item.name} permanently...`);
    permanentlyDelete.mutate(
      { id: item.id, type: item.itemType },
      {
        onSuccess: () => {
          toast.success(`${item.name} permanently deleted`, { id: toastId });
        },
        onError: () => {
          toast.error(`Failed to delete ${item.name}`, { id: toastId });
        },
      }
    );
  };

  const handleEmptyTrash = () => {
    const toastId = toast.loading("Emptying trash...");
    emptyTrash.mutate(undefined, {
      onSuccess: (result) => {
        toast.success(`Deleted ${result.total} items permanently`, { id: toastId });
        setEmptyDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to empty trash", { id: toastId });
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Trash</h1>
          {items.length > 0 && (
            <span className="text-sm text-muted-foreground">
              ({items.length} items)
            </span>
          )}
        </div>
        {items.length > 0 && (
          <AlertDialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Empty Trash
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Empty Trash?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all items in trash. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEmptyTrash}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {emptyTrash.isPending ? "Deleting..." : "Empty Trash"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Trash2 className="h-12 w-12 mb-4" />
            <p className="text-lg">Trash is empty</p>
            <p className="text-sm">
              Items you delete will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <TrashItem
                key={`${item.itemType}-${item.id}`}
                item={item}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {!isLoading && items.length > 0 && (
          <div ref={loadMoreRef} className="w-full py-4 flex justify-center">
            {isFetchingNextPage && (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            )}
            {!hasNextPage && (
              <p className="text-sm text-muted-foreground">No more items</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TrashItemProps {
  item: TrashedItem;
  onRestore: (item: TrashedItem) => void;
  onPermanentDelete: (item: TrashedItem) => void;
}

function TrashItem({ item, onRestore, onPermanentDelete }: TrashItemProps) {
  const isFolder = item.itemType === "folder";
  const trashedDate = item.trashedAt ? new Date(item.trashedAt) : new Date();

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:bg-accent transition-colors">
          {isFolder ? (
            <FolderIcon className="h-10 w-10 text-blue-500" />
          ) : (
            <FileText className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {isFolder ? "Folder" : formatFileSize((item as any).size || 0)} •
              Deleted {formatDistanceToNow(trashedDate, { addSuffix: true })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRestore(item)}
              title="Restore"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPermanentDelete(item)}
              className="text-destructive hover:text-destructive"
              title="Delete permanently"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => onRestore(item)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restore
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => onPermanentDelete(item)}
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Permanently
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
