"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Star } from "lucide-react";
import { FileBrowserSkeleton } from "@/components/loaders/file-browser-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useStarredFolders, useMoveFolder, useToggleFolderStarred } from "@/hooks/use-folders";
import { useStarredAssets, useUpdateAsset, useToggleAssetStarred } from "@/hooks/use-assets";
import { useUser } from "@/hooks/use-user";
import { useMarqueeSelection } from "@/hooks/use-marquee-selection";
import { useFileBrowserShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useViewMode } from "@/hooks/use-view-mode";
import dynamic from "next/dynamic";
import { DraggableFolderItem } from "@/components/files/draggable-folder-item";
import { DraggableFileItem } from "@/components/files/draggable-file-item";
const BulkDeleteDialog = dynamic(() => import("@/components/dialog/bulk-delete-dialog").then(m => ({ default: m.BulkDeleteDialog })));
const BulkMoveDialog = dynamic(() => import("@/components/dialog/bulk-move-dialog").then(m => ({ default: m.BulkMoveDialog })));
const RenameDialog = dynamic(() => import("@/components/dialog/rename-dialog").then(m => ({ default: m.RenameDialog })));
const DeleteDialog = dynamic(() => import("@/components/dialog/delete-dialog").then(m => ({ default: m.DeleteDialog })));
const MoveDialog = dynamic(() => import("@/components/dialog/move-dialog").then(m => ({ default: m.MoveDialog })));
const FilePreviewDialog = dynamic(() => import("@/components/dialog/file-preview-dialog").then(m => ({ default: m.FilePreviewDialog })));

// Preload functions for intent-based loading
const preloadBulkDeleteDialog = () => void import("@/components/dialog/bulk-delete-dialog");
const preloadBulkMoveDialog = () => void import("@/components/dialog/bulk-move-dialog");
const preloadRenameDialog = () => void import("@/components/dialog/rename-dialog");
const preloadDeleteDialog = () => void import("@/components/dialog/delete-dialog");
const preloadMoveDialog = () => void import("@/components/dialog/move-dialog");
const preloadFilePreviewDialog = () => void import("@/components/dialog/file-preview-dialog");
import { EmptyState } from "@/components/shared/empty-state";
import { InfiniteScrollTrigger } from "@/components/shared/infinite-scroll-trigger";
import { SelectionToolbar, type SelectedItem } from "@/components/shared/selection-toolbar";
import { STARRED_LIST_COLUMNS } from "@/components/shared/list-columns";
import { DataList, DataListHeader, DataGrid, DataGridSection, DataGridFolderContainer, DataGridFileContainer } from "@/components/ui/data-list";
import { toast } from "sonner";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { Folder } from "@/types/folder";
import type { Asset } from "@/types/asset";
import AppHeader from "@/components/layouts/app-header";
import { assetService } from "@/services/asset-service";
import { recentService } from "@/services/recent-service";
import { useRouter } from "next/navigation";

export default function StarredPage() {
  const { data: user } = useUser();
  const router = useRouter();
  const { viewMode, setViewMode } = useViewMode();
  const [renameItem, setRenameItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [moveItem, setMoveItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<{ id: string; type: "folder" | "asset"; data: Folder | Asset } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const lastSelectedIndex = useRef<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const selectionMode = selectedItems.size > 0;

  // Preload dialogs when user enters selection mode
  useEffect(() => {
    if (!selectionMode) return;
    preloadBulkDeleteDialog();
    preloadBulkMoveDialog();
    preloadRenameDialog();
    preloadDeleteDialog();
    preloadMoveDialog();
    preloadFilePreviewDialog();
  }, [selectionMode]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: starredFolders = [], isLoading: foldersLoading, refetch: refetchFolders } = useStarredFolders();
  const {
    data: starredAssetsData,
    isLoading: assetsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchAssets,
  } = useStarredAssets();
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();
  const toggleAssetStarred = useToggleAssetStarred();
  const toggleFolderStarred = useToggleFolderStarred();

  const starredAssets = useMemo(() => {
    if (!starredAssetsData?.pages) return [];
    return starredAssetsData.pages.flatMap((page) => page.assets);
  }, [starredAssetsData]);

  // Build allItems and index maps in a single pass
  const { allItems, folderMap, assetMap, allItemIndex } = useMemo(() => {
    const items: Array<{ id: string; type: "folder" | "asset"; name: string; data: Folder | Asset }> = [];
    const fMap = new Map<string, Folder>();
    const aMap = new Map<string, Asset>();
    const index = new Map<string, { item: typeof items[0]; index: number }>();
    for (const folder of starredFolders) {
      const entry = { id: folder.id, type: "folder" as const, name: folder.name, data: folder };
      items.push(entry);
      fMap.set(folder.id, folder);
      index.set(`folder-${folder.id}`, { item: entry, index: items.length - 1 });
    }
    for (const asset of starredAssets) {
      const entry = { id: asset.id, type: "asset" as const, name: asset.name, data: asset };
      items.push(entry);
      aMap.set(asset.id, asset);
      index.set(`asset-${asset.id}`, { item: entry, index: items.length - 1 });
    }
    return { allItems: items, folderMap: fMap, assetMap: aMap, allItemIndex: index };
  }, [starredFolders, starredAssets]);

  const isLoading = foldersLoading || assetsLoading;

  const handleNavigate = (folderId: string | null) => {
    if (folderId) {
      router.push(`/files?folderId=${folderId}`);
    } else {
      router.push("/files");
    }
  };

  const handleDownload = async (asset: Asset) => {
    try {
      // Record asset access for recent items (downloads count as access)
      recentService.recordAccess({ itemId: asset.id, itemType: "asset" }).catch(() => {});

      const { url } = await assetService.getDownloadUrl(asset.id);
      const link = document.createElement("a");
      link.href = url;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleMove = (item: Folder | Asset, type: "folder" | "asset") => setMoveItem({ item, type });

  const handleStarAsset = useCallback((asset: Asset) => {
    toggleAssetStarred.mutate(asset.id, {
      onSuccess: (data) => {
        toast.success(data.isStarred ? "Added to starred" : "Removed from starred");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }, [toggleAssetStarred]);

  const handleStarFolder = useCallback((folder: Folder) => {
    toggleFolderStarred.mutate(folder.id, {
      onSuccess: (data) => {
        toast.success(data.isStarred ? "Added to starred" : "Removed from starred");
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }, [toggleFolderStarred]);

  // Selection handlers
  const handleItemSelect = useCallback((
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
            next.set(`${item.type}-${item.id}`, { id: item.id, type: item.type, name: item.name });
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
  }, [allItems]);

  const handleSelectFolder = useCallback((folder: Folder, _selected: boolean, shiftKey = false, ctrlKey = false) => {
    const entry = allItemIndex.get(`folder-${folder.id}`);
    handleItemSelect(entry?.index ?? -1, folder.id, "folder", folder.name, true, shiftKey, ctrlKey);
  }, [allItemIndex, handleItemSelect]);

  const handleSelectAsset = useCallback((asset: Asset, _selected: boolean, shiftKey = false, ctrlKey = false) => {
    const entry = allItemIndex.get(`asset-${asset.id}`);
    handleItemSelect(entry?.index ?? -1, asset.id, "asset", asset.name, true, shiftKey, ctrlKey);
  }, [allItemIndex, handleItemSelect]);

  const handleContextSelectFolder = useCallback((folder: Folder) => {
    const next = new Map<string, SelectedItem>();
    next.set(`folder-${folder.id}`, { id: folder.id, type: "folder", name: folder.name });
    setSelectedItems(next);
  }, []);

  const handleContextSelectAsset = useCallback((asset: Asset) => {
    const next = new Map<string, SelectedItem>();
    next.set(`asset-${asset.id}`, { id: asset.id, type: "asset", name: asset.name });
    setSelectedItems(next);
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Map());
    lastSelectedIndex.current = null;
  }, []);

  const handleMarqueeSelectionChange = useCallback((selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      handleClearSelection();
      return;
    }

    const newSelection = new Map<string, SelectedItem>();
    for (const id of selectedIds) {
      const entry = allItemIndex.get(id);
      if (entry) {
        newSelection.set(id, { id: entry.item.id, type: entry.item.type, name: entry.item.name });
      }
    }
    setSelectedItems(newSelection);
  }, [allItemIndex, handleClearSelection]);

  // Marquee selection hook
  const { isSelecting: isMarqueeSelecting, marqueeRect, pendingSelection, handleMouseDown: handleMarqueeMouseDown } = useMarqueeSelection({
    items: allItems,
    getItemId: (item) => `${item.type}-${item.id}`,
    onSelectionChange: handleMarqueeSelectionChange,
    containerRef: contentContainerRef,
    itemSelector: "[data-item-id]",
    disabled: !!activeItem,
  });

  const handlePreview = useCallback((asset: Asset) => {
    // Record asset access for recent items
    recentService.recordAccess({ itemId: asset.id, itemType: "asset" }).catch(() => {});
    setPreviewAsset(asset);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedItems.size === 0) return;
    setBulkDeleteOpen(true);
  }, [selectedItems]);

  const handleBulkMove = useCallback(() => {
    if (selectedItems.size === 0) return;
    setBulkMoveOpen(true);
  }, [selectedItems]);

  const handleBulkOperationSuccess = useCallback(() => {
    handleClearSelection();
    Promise.all([refetchFolders(), refetchAssets()]).catch(() => {});
  }, [handleClearSelection, refetchFolders, refetchAssets]);

  const handleBulkDownload = useCallback(async () => {
    const items = Array.from(selectedItems.values());
    const assetIds: string[] = [];
    const folderIds: string[] = [];
    for (const item of items) {
      if (item.type === "asset") assetIds.push(item.id);
      else folderIds.push(item.id);
    }

    if (assetIds.length === 0 && folderIds.length === 0) {
      toast.info("No items selected for download");
      return;
    }

    const toastId = toast.loading("Preparing download");
    try {
      const blob = await assetService.bulkDownload({ assetIds, folderIds });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `starred-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started", { id: toastId });
      handleClearSelection();
    } catch (error) {
      toast.error(getApiErrorMessage(error), { id: toastId });
    }
  }, [selectedItems, handleClearSelection]);

  const handleSelectAll = useCallback(() => {
    const newSelection = new Map<string, SelectedItem>();
    for (const item of allItems) {
      newSelection.set(`${item.type}-${item.id}`, { id: item.id, type: item.type, name: item.name });
    }
    setSelectedItems(newSelection);
  }, [allItems]);

  const handleKeyboardStar = useCallback(() => {
    if (selectedItems.size !== 1) return;
    const [selected] = Array.from(selectedItems.values());
    if (selected.type === "folder") {
      const folder = folderMap.get(selected.id);
      if (folder) handleStarFolder(folder);
    } else {
      const asset = assetMap.get(selected.id);
      if (asset) handleStarAsset(asset);
    }
  }, [selectedItems, folderMap, assetMap, handleStarFolder, handleStarAsset]);

  const handleKeyboardRename = useCallback(() => {
    if (selectedItems.size !== 1) return;
    const [selected] = Array.from(selectedItems.values());
    if (selected.type === "folder") {
      const folder = folderMap.get(selected.id);
      if (folder) setRenameItem({ item: folder, type: "folder" });
    } else {
      const asset = assetMap.get(selected.id);
      if (asset) setRenameItem({ item: asset, type: "asset" });
    }
  }, [selectedItems, folderMap, assetMap]);

  const handleKeyboardPreview = useCallback(() => {
    if (selectedItems.size !== 1) return;
    const [selected] = Array.from(selectedItems.values());
    if (selected.type === "folder") {
      handleNavigate(selected.id);
    } else {
      const asset = assetMap.get(selected.id);
      if (asset) handlePreview(asset);
    }
  }, [selectedItems, assetMap, handleNavigate, handlePreview]);

  const handleRefresh = useCallback(() => {
    Promise.all([refetchFolders(), refetchAssets()]).catch(() => {});
  }, [refetchFolders, refetchAssets]);

  // Keyboard shortcuts
  useFileBrowserShortcuts(
    {
      onSelectAll: handleSelectAll,
      onDownload: handleBulkDownload,
      onStar: handleKeyboardStar,
      onRename: handleKeyboardRename,
      onDelete: handleBulkDelete,
      onMove: handleBulkMove,
      onRefresh: handleRefresh,
      onEscape: handleClearSelection,
      onPreview: handleKeyboardPreview,
    },
    { enabled: true, hasSelection: selectedItems.size > 0 }
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { type: "folder" | "asset"; item: Folder | Asset };
    setActiveItem({ id: active.id as string, type: data.type, data: data.item });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);
      if (!over) return;

      const activeData = active.data.current as { type: "folder" | "asset"; item: Folder | Asset };
      const overId = over.id as string;

      let targetFolderId: string | null = null;
      if (overId === "root-drop-zone") targetFolderId = null;
      else if (overId.startsWith("folder-")) targetFolderId = overId.replace("folder-", "");
      else return;

      if (activeData.type === "folder") {
        const folder = activeData.item as Folder;
        if (folder.parentId === targetFolderId || folder.id === targetFolderId) return;
        moveFolder.mutate(
          { id: folder.id, input: { parentId: targetFolderId } },
          {
            onSuccess: () => { toast.success("Folder moved"); refetchFolders(); },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          }
        );
      } else {
        const asset = activeData.item as Asset;
        if (asset.folderId === targetFolderId) return;
        updateAsset.mutate(
          { id: asset.id, input: { folderId: targetFolderId } },
          {
            onSuccess: () => { toast.success("File moved"); refetchAssets(); },
            onError: (error) => toast.error(getApiErrorMessage(error)),
          }
        );
      }
    },
    [moveFolder, updateAsset, refetchFolders, refetchAssets]
  );

  return (
    <div className="flex flex-col h-full overflow-clip">
      <AppHeader
        breadcrumbPath={[]}
        handleNavigate={handleNavigate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        title="Starred"
        onPreviewAsset={handlePreview}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full">
            <div
              ref={contentContainerRef}
              className={cn("p-6 relative min-h-[calc(100vh-8rem)]", selectionMode && "pb-24 sm:pb-20")}
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
                <FileBrowserSkeleton viewMode={viewMode} />
              ) : starredFolders.length === 0 && starredAssets.length === 0 ? (
                <EmptyState
                  variant="starred"
                  title="No starred items yet"
                  description="Star your important files and folders to keep them easily accessible. Click the star icon on any item to add it here."
                  actions={[
                    {
                      label: "Browse files",
                      onClick: () => router.push("/files"),
                    },
                  ]}
                />
              ) : viewMode === "grid" ? (
                /* Grid View - Folders first (compact), then Files */
                <DataGrid>
                  {/* Folders Section */}
                  {starredFolders.length > 0 && (
                    <DataGridSection title="Folders">
                      <DataGridFolderContainer>
                        {starredFolders.map((folder, index) => (
                          <DraggableFolderItem
                            key={folder.id}
                            folder={folder}
                            onOpen={handleNavigate}
                            onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                            onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                            onMove={(f) => handleMove(f, "folder")}
                            onStar={handleStarFolder}
                            viewMode={viewMode}
                            index={index}
                            isSelected={selectedItems.has(`folder-${folder.id}`)}
                            isPendingSelection={pendingSelection.has(`folder-${folder.id}`)}
                            onSelect={handleSelectFolder}
                            onContextSelect={handleContextSelectFolder}
                            selectionMode={selectionMode}
                            selectedCount={selectedItems.size}
                            onBulkDownload={handleBulkDownload}
                            onBulkDelete={handleBulkDelete}
                            onBulkMove={handleBulkMove}
                            showOwner
                            owner={user?.name ? { id: user.id, name: user.name } : undefined}
                          />
                        ))}
                      </DataGridFolderContainer>
                    </DataGridSection>
                  )}

                  {/* Files Section */}
                  {starredAssets.length > 0 && (
                    <DataGridSection title="Files">
                      <DataGridFileContainer>
                        {starredAssets.map((asset, index) => (
                          <DraggableFileItem
                            key={asset.id}
                            asset={asset}
                            onDownload={handleDownload}
                            onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                            onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                            onMove={(a) => handleMove(a, "asset")}
                            onStar={handleStarAsset}
                            onPreview={handlePreview}
                            viewMode={viewMode}
                            index={starredFolders.length + index}
                            isSelected={selectedItems.has(`asset-${asset.id}`)}
                            isPendingSelection={pendingSelection.has(`asset-${asset.id}`)}
                            onSelect={handleSelectAsset}
                            onContextSelect={handleContextSelectAsset}
                            selectionMode={selectionMode}
                            selectedCount={selectedItems.size}
                            onBulkDownload={handleBulkDownload}
                            onBulkDelete={handleBulkDelete}
                            onBulkMove={handleBulkMove}
                            showOwner
                            owner={user?.name ? { id: user.id, name: user.name } : undefined}
                          />
                        ))}
                      </DataGridFileContainer>
                    </DataGridSection>
                  )}
                </DataGrid>
              ) : (
                /* List View - Combined */
                <DataList>
                  <DataListHeader columns={STARRED_LIST_COLUMNS} />
                  {starredFolders.map((folder, index) => (
                    <DraggableFolderItem
                      key={folder.id}
                      folder={folder}
                      onOpen={handleNavigate}
                      onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                      onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                      onMove={(f) => handleMove(f, "folder")}
                      onStar={handleStarFolder}
                      viewMode={viewMode}
                      index={index}
                      isSelected={selectedItems.has(`folder-${folder.id}`)}
                      isPendingSelection={pendingSelection.has(`folder-${folder.id}`)}
                      onSelect={handleSelectFolder}
                      onContextSelect={handleContextSelectFolder}
                      selectionMode={selectionMode}
                      selectedCount={selectedItems.size}
                      onBulkDownload={handleBulkDownload}
                      onBulkDelete={handleBulkDelete}
                      onBulkMove={handleBulkMove}
                      showOwner
                      owner={user?.name ? { id: user.id, name: user.name } : undefined}
                    />
                  ))}
                  {starredAssets.map((asset, index) => (
                    <DraggableFileItem
                      key={asset.id}
                      asset={asset}
                      onDownload={handleDownload}
                      onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                      onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                      onMove={(a) => handleMove(a, "asset")}
                      onStar={handleStarAsset}
                      onPreview={handlePreview}
                      viewMode={viewMode}
                      index={starredFolders.length + index}
                      isSelected={selectedItems.has(`asset-${asset.id}`)}
                      isPendingSelection={pendingSelection.has(`asset-${asset.id}`)}
                      onSelect={handleSelectAsset}
                      onContextSelect={handleContextSelectAsset}
                      selectionMode={selectionMode}
                      selectedCount={selectedItems.size}
                      onBulkDownload={handleBulkDownload}
                      onBulkDelete={handleBulkDelete}
                      onBulkMove={handleBulkMove}
                      showOwner
                      owner={user?.name ? { id: user.id, name: user.name } : undefined}
                    />
                  ))}
                </DataList>
              )}

              {!isLoading && (starredFolders.length > 0 || starredAssets.length > 0) && (
                <InfiniteScrollTrigger
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80 bg-card border border-border/60 rounded-lg p-4 flex items-center gap-3">
              <Star className="h-6 w-6" />
              <span className="font-medium">{activeItem.data.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <RenameDialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)} item={renameItem?.item ?? null} itemType={renameItem?.type ?? "folder"} />
      <DeleteDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)} item={deleteItem?.item ?? null} itemType={deleteItem?.type ?? "folder"} />
      <MoveDialog open={!!moveItem} onOpenChange={(open) => !open && setMoveItem(null)} item={moveItem?.item ?? null} itemType={moveItem?.type ?? "folder"} />
      <BulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        items={Array.from(selectedItems.values())}
        onSuccess={handleBulkOperationSuccess}
      />
      <BulkMoveDialog
        open={bulkMoveOpen}
        onOpenChange={setBulkMoveOpen}
        items={Array.from(selectedItems.values())}
        onSuccess={handleBulkOperationSuccess}
      />
      <FilePreviewDialog
        open={!!previewAsset}
        onOpenChange={(open) => !open && setPreviewAsset(null)}
        asset={previewAsset}
        assets={starredAssets}
        onNavigate={handlePreview}
      />

      <SelectionToolbar
        selectedItems={Array.from(selectedItems.values())}
        onClearSelection={handleClearSelection}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onDownload={handleBulkDownload}
      />
    </div>
  );
}
