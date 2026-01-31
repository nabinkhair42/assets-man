"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Trash2, RotateCcw, X, RefreshCw } from "lucide-react";
import { TrashSkeleton } from "@/components/loaders/trash-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { SearchCommand } from "@/components/dialog/search-command";
import { Button } from "@/components/ui/button";
import { EmptyTrashTrigger } from "@/components/dialog/empty-trash-dialog";

const EmptyTrashDialog = dynamic(() =>
  import("@/components/dialog/empty-trash-dialog").then((m) => ({
    default: m.EmptyTrashDialog,
  })),
);
const PermanentDeleteDialog = dynamic(() =>
  import("@/components/dialog/permanent-delete-dialog").then((m) => ({
    default: m.PermanentDeleteDialog,
  })),
);

// Preload functions for intent-based loading (Rule 2.5)
const preloadEmptyTrashDialog = () =>
  void import("@/components/dialog/empty-trash-dialog");
const preloadPermanentDeleteDialog = () =>
  void import("@/components/dialog/permanent-delete-dialog");
import { EmptyState } from "@/components/shared/empty-state";
import { ListHeader } from "@/components/shared/list-header";
import { InfiniteScrollTrigger } from "@/components/shared/infinite-scroll-trigger";
import { TRASH_LIST_COLUMNS } from "@/components/shared/list-columns";
import { type SelectedItem } from "@/components/shared/selection-toolbar";
import { TrashItem } from "./trash-item";
import {
  useInfiniteTrash,
  useRestoreItem,
  usePermanentlyDelete,
  trashKeys,
} from "@/hooks/use-trash";
import { useQueryClient } from "@tanstack/react-query";
import { useMarqueeSelection } from "@/hooks/use-marquee-selection";
import {
  useKeyboardShortcuts,
  type KeyboardShortcut,
} from "@/hooks/use-keyboard-shortcuts";
import { toast } from "sonner";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { TrashedItem } from "@/types/trash";

export function TrashBrowser() {
  const queryClient = useQueryClient();
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<TrashedItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(
    () => new Map(),
  );
  const lastSelectedIndex = useRef<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const selectionMode = selectedItems.size > 0;

  // Preload dialogs based on user intent (Rule 2.5)
  useEffect(() => {
    if (!selectionMode) return;
    preloadPermanentDeleteDialog();
  }, [selectionMode]);

  const {
    data: trashData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTrash();
  const restoreItem = useRestoreItem();
  const permanentlyDelete = usePermanentlyDelete();

  const items = useMemo(() => {
    if (!trashData?.pages) return [];
    return trashData.pages.flatMap((page) => page.items);
  }, [trashData]);

  // Combined list of all items for index-based operations
  const allItems = useMemo(() => {
    return items.map((item) => ({
      id: item.id,
      type: item.itemType,
      name: item.name,
      data: item,
    }));
  }, [items]);

  // Index map for O(1) lookups in selection handlers (Rule 7.6)
  const allItemIndex = useMemo(() => {
    const map = new Map<
      string,
      { item: (typeof allItems)[0]; index: number }
    >();
    allItems.forEach((item, index) =>
      map.set(`${item.type}-${item.id}`, { item, index }),
    );
    return map;
  }, [allItems]);

  const handleRestore = useCallback(
    (item: TrashedItem) => {
      const toastId = toast.loading(`Restoring ${item.name}`);
      restoreItem.mutate(
        { id: item.id, type: item.itemType },
        {
          onSuccess: () =>
            toast.success(`${item.name} restored`, { id: toastId }),
          onError: (error) =>
            toast.error(
              getApiErrorMessage(error, `Failed to restore ${item.name}`),
              { id: toastId },
            ),
        },
      );
    },
    [restoreItem],
  );

  const handlePermanentDelete = useCallback((item: TrashedItem) => {
    setDeleteItem(item);
  }, []);

  // Selection handlers
  const handleItemSelect = useCallback(
    (
      index: number,
      id: string,
      type: "folder" | "asset",
      name: string,
      _selected: boolean,
      shiftKey: boolean,
      ctrlKey: boolean = false,
    ) => {
      setSelectedItems((prev) => {
        const key = `${type}-${id}`;

        if (shiftKey && lastSelectedIndex.current !== null) {
          const next = new Map(prev);
          const start = Math.min(lastSelectedIndex.current, index);
          const end = Math.max(lastSelectedIndex.current, index);

          for (let i = start; i <= end; i++) {
            const item = allItems[i];
            if (item) {
              next.set(`${item.type}-${item.id}`, {
                id: item.id,
                type: item.type,
                name: item.name,
              });
            }
          }
          return next;
        } else if (ctrlKey) {
          const next = new Map(prev);
          if (next.has(key)) {
            next.delete(key);
          } else {
            next.set(key, { id, type, name });
            lastSelectedIndex.current = index;
          }
          return next;
        } else {
          const next = new Map<string, SelectedItem>();
          next.set(key, { id, type, name });
          lastSelectedIndex.current = index;
          return next;
        }
      });
    },
    [allItems],
  );

  const handleSelectItem = useCallback(
    (item: TrashedItem, _selected: boolean, shiftKey = false) => {
      const entry = allItemIndex.get(`${item.itemType}-${item.id}`);
      handleItemSelect(
        entry?.index ?? -1,
        item.id,
        item.itemType,
        item.name,
        true,
        shiftKey,
      );
    },
    [allItemIndex, handleItemSelect],
  );

  const handleContextSelectItem = useCallback((item: TrashedItem) => {
    const next = new Map<string, SelectedItem>();
    next.set(`${item.itemType}-${item.id}`, {
      id: item.id,
      type: item.itemType,
      name: item.name,
    });
    setSelectedItems(next);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Map());
    lastSelectedIndex.current = null;
  }, []);

  const handleMarqueeSelectionChange = useCallback(
    (selectedIds: string[]) => {
      if (selectedIds.length === 0) {
        handleClearSelection();
        return;
      }

      const newSelection = new Map<string, SelectedItem>();
      for (const id of selectedIds) {
        const entry = allItemIndex.get(id);
        if (entry) {
          newSelection.set(id, {
            id: entry.item.id,
            type: entry.item.type as "folder" | "asset",
            name: entry.item.name,
          });
        }
      }
      setSelectedItems(newSelection);
    },
    [allItemIndex, handleClearSelection],
  );

  // Marquee selection hook
  const {
    isSelecting: isMarqueeSelecting,
    marqueeRect,
    pendingSelection,
    handleMouseDown: handleMarqueeMouseDown,
  } = useMarqueeSelection({
    items: allItems,
    getItemId: (item) => `${item.type}-${item.id}`,
    onSelectionChange: handleMarqueeSelectionChange,
    containerRef: contentContainerRef,
    itemSelector: "[data-item-id]",
  });

  // Bulk operations — parallelized with Promise.allSettled (Rule 1.4)
  const handleBulkRestore = useCallback(async () => {
    const selectedList = Array.from(selectedItems.values());
    if (selectedList.length === 0) return;

    const toastId = toast.loading(`Restoring ${selectedList.length} items`);
    const results = await Promise.allSettled(
      selectedList.map((item) =>
        restoreItem.mutateAsync({ id: item.id, type: item.type }),
      ),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.length - successCount;

    handleClearSelection();
    if (failCount === 0) {
      toast.success(`${successCount} items restored`, { id: toastId });
    } else {
      toast.error(`Restored ${successCount}, failed to restore ${failCount}`, {
        id: toastId,
      });
    }
  }, [selectedItems, restoreItem, handleClearSelection]);

  const handleBulkDelete = useCallback(async () => {
    const selectedList = Array.from(selectedItems.values());
    if (selectedList.length === 0) return;

    const toastId = toast.loading(
      `Deleting ${selectedList.length} items permanently`,
    );
    const results = await Promise.allSettled(
      selectedList.map((item) =>
        permanentlyDelete.mutateAsync({ id: item.id, type: item.type }),
      ),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    const failCount = results.length - successCount;

    handleClearSelection();
    if (failCount === 0) {
      toast.success(`${successCount} items deleted permanently`, {
        id: toastId,
      });
    } else {
      toast.error(`Deleted ${successCount}, failed to delete ${failCount}`, {
        id: toastId,
      });
    }
  }, [selectedItems, permanentlyDelete, handleClearSelection]);

  const handleSelectAll = useCallback(() => {
    const newSelection = new Map<string, SelectedItem>();
    for (const item of allItems) {
      newSelection.set(`${item.type}-${item.id}`, {
        id: item.id,
        type: item.type,
        name: item.name,
      });
    }
    setSelectedItems(newSelection);
  }, [allItems]);

  // Keyboard shortcuts (trash-specific)
  const shortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: "a",
        ctrl: true,
        action: handleSelectAll,
        description: "Select all",
        enabled: items.length > 0,
      },
      {
        key: "r",
        ctrl: true,
        action: handleBulkRestore,
        description: "Restore",
        enabled: selectedItems.size > 0,
      },
      {
        key: "Delete",
        action: handleBulkDelete,
        description: "Permanently delete",
        enabled: selectedItems.size > 0,
      },
      {
        key: "Backspace",
        action: handleBulkDelete,
        description: "Permanently delete",
        enabled: selectedItems.size > 0,
      },
      {
        key: "Escape",
        action: handleClearSelection,
        description: "Clear selection",
        enabled: selectedItems.size > 0,
      },
    ],
    [
      handleSelectAll,
      handleBulkRestore,
      handleBulkDelete,
      handleClearSelection,
      items.length,
      selectedItems.size,
    ],
  );

  useKeyboardShortcuts({ shortcuts, enabled: true });

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
  }, [queryClient]);

  return (
    <div className="flex flex-col h-full">
      {/* Header - Consistent with AppHeader styling */}
      <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center h-14 px-4">
          {/* Left section - Sidebar trigger and title */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <SidebarTrigger className="h-8 w-8" />
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold">Trash</h1>
              {items.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({items.length})
                </span>
              )}
            </div>
          </div>

          {/* Center section - Search */}
          <div className="flex-1 flex justify-center px-4">
            <SearchCommand />
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={handleRefresh}
              tooltipContent="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>

            {/* Empty Trash button */}
            {items.length > 0 && (
              <div className="ml-1">
                <span
                  onMouseEnter={preloadEmptyTrashDialog}
                  onFocus={preloadEmptyTrashDialog}
                >
                  <EmptyTrashTrigger onClick={() => setEmptyDialogOpen(true)} />
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div
          ref={contentContainerRef}
          className={cn(
            "p-6 relative min-h-[calc(100vh-8rem)]",
            selectionMode && "pb-24 sm:pb-20",
          )}
          onMouseDown={handleMarqueeMouseDown}
        >
          {/* Marquee selection rectangle */}
          {isMarqueeSelecting && marqueeRect && (
            <div
              className="absolute border-2 border-primary bg-primary/10 pointer-events-none z-50"
              style={{
                left: marqueeRect.left,
                top: marqueeRect.top,
                width: marqueeRect.width,
                height: marqueeRect.height,
              }}
            />
          )}
          {isLoading ? (
            <TrashSkeleton />
          ) : items.length === 0 ? (
            <EmptyState
              variant="trash"
              title="Trash is empty"
              description="Items you delete will appear here. Deleted items are permanently removed after 30 days."
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
                  isSelected={selectedItems.has(`${item.itemType}-${item.id}`)}
                  isPendingSelection={pendingSelection.has(
                    `${item.itemType}-${item.id}`,
                  )}
                  onSelect={handleSelectItem}
                  onContextSelect={handleContextSelectItem}
                  selectedCount={selectedItems.size}
                  onBulkRestore={handleBulkRestore}
                  onBulkDelete={handleBulkDelete}
                />
              ))}
            </div>
          )}

          {!isLoading && items.length > 0 && (
            <InfiniteScrollTrigger
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              fetchNextPage={fetchNextPage}
            />
          )}
        </div>
      </ScrollArea>

      {/* Selection toolbar */}
      {selectionMode && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card border border-border shadow-lg rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground mr-2">
            {selectedItems.size} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkRestore}
            className="gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restore
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={handleClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <EmptyTrashDialog
        open={emptyDialogOpen}
        onOpenChange={setEmptyDialogOpen}
      />
      <PermanentDeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem}
      />
    </div>
  );
}
