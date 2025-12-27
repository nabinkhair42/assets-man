"use client";

import { useState, useMemo } from "react";
import { Trash2 } from "lucide-react";
import { TrashSkeleton } from "@/components/loaders";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { EmptyTrashDialog, EmptyTrashTrigger, PermanentDeleteDialog } from "@/components/dialog";
import { EmptyState, ListHeader, InfiniteScrollTrigger } from "@/components/shared";
import { TrashItem } from "./trash-item";
import { useInfiniteTrash, useRestoreItem } from "@/hooks";
import { toast } from "sonner";
import type { TrashedItem } from "@/types";

const TRASH_LIST_COLUMNS = [
  { label: "", width: "w-8" },
  { label: "Name" },
  { label: "Size", width: "w-24", align: "right" as const, hideBelow: "sm" as const },
  { label: "Deleted", width: "w-32", align: "right" as const, hideBelow: "md" as const },
  { label: "", width: "w-20" },
];

export function TrashBrowser() {
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TrashedItem | null>(null);

  const {
    data: trashData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTrash();
  const restoreItem = useRestoreItem();

  const items = useMemo(() => {
    if (!trashData?.pages) return [];
    return trashData.pages.flatMap((page) => page.items);
  }, [trashData]);

  const handleRestore = (item: TrashedItem) => {
    const toastId = toast.loading(`Restoring ${item.name}...`);
    restoreItem.mutate(
      { id: item.id, type: item.itemType },
      {
        onSuccess: () => toast.success(`${item.name} restored`, { id: toastId }),
        onError: () => toast.error(`Failed to restore ${item.name}`, { id: toastId }),
      }
    );
  };

  const handlePermanentDelete = (item: TrashedItem) => {
    setDeleteItem(item);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="w-px h-5 bg-border/60" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-medium">Trash</h1>
            {items.length > 0 && (
              <span className="text-sm text-muted-foreground">({items.length} items)</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {items.length > 0 && (
            <>
              <div className="w-px h-5 bg-border/60" />
              <EmptyTrashTrigger onClick={() => setEmptyDialogOpen(true)} />
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
            <EmptyState
              icon={Trash2}
              title="Trash is empty"
              description="Items you delete will appear here"
            />
          ) : (
            <div className="flex flex-col">
              <ListHeader columns={TRASH_LIST_COLUMNS} />
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

          {!isLoading && items.length > 0 && (
            <InfiniteScrollTrigger
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
              endMessage="No more items"
            />
          )}
        </div>
      </ScrollArea>

      <EmptyTrashDialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen} />
      <PermanentDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem}
      />
    </div>
  );
}
