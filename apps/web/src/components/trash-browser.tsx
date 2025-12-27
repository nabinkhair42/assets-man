"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  Trash2,
  RotateCcw,
  Loader2,
  Folder as FolderIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  File,
} from "lucide-react";
import { TrashSkeleton } from "@/components/loaders";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { cn } from "@/lib/utils";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function getFileIconData(mimeType: string) {
  if (mimeType?.startsWith("image/")) return { icon: FileImage, color: "text-pink-500", bg: "bg-pink-500/10" };
  if (mimeType?.startsWith("video/")) return { icon: FileVideo, color: "text-purple-500", bg: "bg-purple-500/10" };
  if (mimeType?.startsWith("audio/")) return { icon: FileAudio, color: "text-orange-500", bg: "bg-orange-500/10" };
  if (mimeType?.includes("pdf") || mimeType?.includes("document") || mimeType?.includes("text"))
    return { icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" };
  if (mimeType?.includes("zip") || mimeType?.includes("rar") || mimeType?.includes("archive"))
    return { icon: FileArchive, color: "text-amber-500", bg: "bg-amber-500/10" };
  return { icon: File, color: "text-muted-foreground", bg: "bg-muted" };
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
      {/* Header - consistent with AppHeader */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="w-px h-5 bg-border/60" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-medium">Trash</h1>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">
                ({items.length} items)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {items.length > 0 && (
            <>
              <div className="w-px h-5 bg-border/60" />
              <AlertDialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" tooltipContent="Permanently delete all items">
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
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-6">
          {isLoading ? (
            <TrashSkeleton />
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Trash2 className="h-12 w-12 mb-4" />
              <p className="text-lg">Trash is empty</p>
              <p className="text-sm">Items you delete will appear here</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60 mb-1">
                <div className="w-8" />
                <div className="flex-1 min-w-0">Name</div>
                <div className="w-24 text-right hidden sm:block">Size</div>
                <div className="w-32 text-right hidden md:block">Deleted</div>
                <div className="w-20" />
              </div>
              {items.map((item, index) => (
                <TrashItem
                  key={`${item.itemType}-${item.id}`}
                  item={item}
                  index={index}
                  onRestore={handleRestore}
                  onPermanentDelete={handlePermanentDelete}
                />
              ))}
            </div>
          )}

          {/* Infinite scroll trigger */}
          {!isLoading && items.length > 0 && (
            <div ref={loadMoreRef} className="w-full py-2 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              )}
              {!hasNextPage && (
                <p className="text-sm text-muted-foreground">No more items</p>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface TrashItemProps {
  item: TrashedItem;
  index: number;
  onRestore: (item: TrashedItem) => void;
  onPermanentDelete: (item: TrashedItem) => void;
}

function TrashItem({ item, onRestore, onPermanentDelete }: TrashItemProps) {
  const isFolder = item.itemType === "folder";
  const trashedDate = item.trashedAt ? new Date(item.trashedAt) : new Date();

  // Get appropriate icon for file type
  const mimeType = (item as any).mimeType || "";
  const { icon: FileIcon, color, bg } = isFolder
    ? { icon: FolderIcon, color: "text-primary", bg: "bg-primary/10" }
    : getFileIconData(mimeType);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          className="group flex items-center gap-3 px-4 py-3 transition-all duration-150 hover:bg-accent/50"
        >
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-md", bg)}>
            <FileIcon className={cn("h-4 w-4", color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-sm text-foreground">{item.name}</p>
          </div>
          <div className="w-24 text-right text-sm text-muted-foreground hidden sm:block">
            {isFolder ? "—" : formatFileSize((item as any).size || 0)}
          </div>
          <div className="w-32 text-right text-sm text-muted-foreground hidden md:block">
            {formatDistanceToNow(trashedDate, { addSuffix: true })}
          </div>
          <div className="w-20 flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRestore(item);
              }}
              tooltipContent="Restore item"
              className="h-8 w-8 opacity-60 hover:opacity-100"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={(e) => {
                e.stopPropagation();
                onPermanentDelete(item);
              }}
              className="h-8 w-8 opacity-60 hover:opacity-100 text-destructive hover:text-destructive"
              tooltipContent="Delete permanently"
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
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Permanently
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
