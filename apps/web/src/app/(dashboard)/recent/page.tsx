"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Clock } from "lucide-react";
import { FileBrowserSkeleton } from "@/components/loaders";
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
import {
  useRecentItems,
  useFolders,
  useMoveFolder,
  useUpdateAsset,
  useToggleAssetStarred,
  useToggleFolderStarred,
  useUser,
  useMarqueeSelection,
} from "@/hooks";
import { DraggableFolderItem } from "@/components/files/draggable-folder-item";
import { DraggableFileItem } from "@/components/files/draggable-file-item";
import {
  BulkDeleteDialog,
  BulkMoveDialog,
  RenameDialog,
  DeleteDialog,
  MoveDialog,
  FilePreviewDialog,
} from "@/components/dialog";
import { EmptyState, ListHeader, SelectionToolbar, type SelectedItem } from "@/components/shared";
import { toast } from "sonner";
import type { Folder, Asset } from "@/types";
import { AppHeader } from "@/components/layouts";
import { assetService, recentService } from "@/services";
import { useRouter } from "next/navigation";

const FILE_LIST_COLUMNS = [
  { label: "Name" },
  { label: "Owner", width: "w-10", align: "center" as const, hideBelow: "sm" as const },
  { label: "Size", width: "w-24", align: "right" as const, hideBelow: "sm" as const },
  { label: "Accessed", width: "w-32", align: "right" as const, hideBelow: "md" as const },
  { label: "", width: "w-8" },
];

export default function RecentPage() {
  const { data: user } = useUser();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useFolders();
  const { data: recentData, isLoading, refetch: refetchRecent } = useRecentItems({ limit: 50 });
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();
  const toggleAssetStarred = useToggleAssetStarred();
  const toggleFolderStarred = useToggleFolderStarred();

  // Extract folders and assets from recent items
  const recentFolders = useMemo(() => {
    if (!recentData?.items) return [];
    return recentData.items
      .filter((item) => item.itemType === "folder" && item.folder)
      .map((item) => item.folder as Folder);
  }, [recentData]);

  const recentAssets = useMemo(() => {
    if (!recentData?.items) return [];
    return recentData.items
      .filter((item) => item.itemType === "asset" && item.asset)
      .map((item) => item.asset as Asset);
  }, [recentData]);

  const allItems = useMemo(() => {
    if (!recentData?.items) return [];
    return recentData.items
      .filter((item) => (item.itemType === "folder" && item.folder) || (item.itemType === "asset" && item.asset))
      .map((item) => ({
        id: item.itemType === "folder" ? item.folder!.id : item.asset!.id,
        type: item.itemType,
        name: item.itemType === "folder" ? item.folder!.name : item.asset!.name,
        data: item.itemType === "folder" ? item.folder! : item.asset!,
        accessedAt: item.accessedAt,
      }));
  }, [recentData]);

  const handleNavigate = (folderId: string | null) => {
    if (folderId) {
      // Record the folder access
      recentService.recordAccess({ itemId: folderId, itemType: "folder" }).catch(() => {});
      router.push(`/files?folderId=${folderId}`);
    } else {
      router.push("/files");
    }
  };

  const handleDownload = async (asset: Asset) => {
    try {
      const { url } = await assetService.getDownloadUrl(asset.id);
      const link = document.createElement("a");
      link.href = url;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      toast.error("Failed to get download URL");
    }
  };

  const handlePreview = useCallback((asset: Asset) => {
    // Record asset access when previewing
    recentService.recordAccess({ itemId: asset.id, itemType: "asset" }).catch(() => {});
    setPreviewAsset(asset);
  }, []);

  const handleMove = (item: Folder | Asset, type: "folder" | "asset") => setMoveItem({ item, type });

  const handleStarAsset = useCallback((asset: Asset) => {
    toggleAssetStarred.mutate(asset.id, {
      onSuccess: (data) => {
        toast.success(data.isStarred ? "Added to starred" : "Removed from starred");
        refetchRecent();
      },
      onError: () => toast.error("Failed to update starred status"),
    });
  }, [toggleAssetStarred, refetchRecent]);

  const handleStarFolder = useCallback((folder: Folder) => {
    toggleFolderStarred.mutate(folder.id, {
      onSuccess: (data) => {
        toast.success(data.isStarred ? "Added to starred" : "Removed from starred");
        refetchRecent();
      },
      onError: () => toast.error("Failed to update starred status"),
    });
  }, [toggleFolderStarred, refetchRecent]);

  // Selection handlers
  const handleItemSelect = useCallback((
    index: number,
    id: string,
    type: "folder" | "asset",
    name: string,
    selected: boolean,
    shiftKey: boolean
  ) => {
    setSelectedItems((prev) => {
      const next = new Map(prev);
      const key = `${type}-${id}`;

      if (shiftKey && lastSelectedIndex.current !== null && selected) {
        const start = Math.min(lastSelectedIndex.current, index);
        const end = Math.max(lastSelectedIndex.current, index);

        for (let i = start; i <= end; i++) {
          const item = allItems[i];
          if (item) {
            next.set(`${item.type}-${item.id}`, { id: item.id, type: item.type, name: item.name });
          }
        }
      } else {
        if (selected) {
          next.set(key, { id, type, name });
        } else {
          next.delete(key);
        }
      }

      if (selected) {
        lastSelectedIndex.current = index;
      }

      return next;
    });
  }, [allItems]);

  const handleSelectFolder = useCallback((folder: Folder, selected: boolean, shiftKey = false) => {
    const index = allItems.findIndex((item) => item.type === "folder" && item.id === folder.id);
    handleItemSelect(index, folder.id, "folder", folder.name, selected, shiftKey);
  }, [allItems, handleItemSelect]);

  const handleSelectAsset = useCallback((asset: Asset, selected: boolean, shiftKey = false) => {
    const index = allItems.findIndex((item) => item.type === "asset" && item.id === asset.id);
    handleItemSelect(index, asset.id, "asset", asset.name, selected, shiftKey);
  }, [allItems, handleItemSelect]);

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
      const [type, ...idParts] = id.split("-");
      const itemId = idParts.join("-");
      const item = allItems.find((i) => i.type === type && i.id === itemId);
      if (item) {
        newSelection.set(id, { id: itemId, type: item.type, name: item.name });
      }
    }
    setSelectedItems(newSelection);
  }, [allItems, handleClearSelection]);

  // Marquee selection hook
  const { isSelecting: isMarqueeSelecting, marqueeRect, pendingSelection, handleMouseDown: handleMarqueeMouseDown } = useMarqueeSelection({
    items: allItems,
    getItemId: (item) => `${item.type}-${item.id}`,
    onSelectionChange: handleMarqueeSelectionChange,
    containerRef: contentContainerRef,
    itemSelector: "[data-item-id]",
    disabled: !!activeItem,
  });

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
    refetchRecent();
  }, [handleClearSelection, refetchRecent]);

  const handleBulkDownload = useCallback(async () => {
    const items = Array.from(selectedItems.values());
    const assetIds = items.filter((item) => item.type === "asset").map((item) => item.id);
    const folderIds = items.filter((item) => item.type === "folder").map((item) => item.id);

    if (assetIds.length === 0 && folderIds.length === 0) {
      toast.info("No items selected for download");
      return;
    }

    const toastId = toast.loading("Preparing download...");
    try {
      const blob = await assetService.bulkDownload({ assetIds, folderIds });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `recent-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started", { id: toastId });
      handleClearSelection();
    } catch {
      toast.error("Failed to download files", { id: toastId });
    }
  }, [selectedItems, handleClearSelection]);

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
            onSuccess: () => { toast.success("Folder moved"); refetchRecent(); },
            onError: () => toast.error("Failed to move folder"),
          }
        );
      } else {
        const asset = activeData.item as Asset;
        if (asset.folderId === targetFolderId) return;
        updateAsset.mutate(
          { id: asset.id, input: { folderId: targetFolderId } },
          {
            onSuccess: () => { toast.success("File moved"); refetchRecent(); },
            onError: () => toast.error("Failed to move file"),
          }
        );
      }
    },
    [moveFolder, updateAsset, refetchRecent]
  );

  return (
    <div className="flex flex-col h-full overflow-clip">
      <AppHeader
        breadcrumbPath={[]}
        handleNavigate={handleNavigate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        title="Recent"
        onPreviewAsset={handlePreview}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 min-h-0 relative">
          <ScrollArea className="h-full">
            <div
              ref={contentContainerRef}
              className="p-6 relative min-h-[calc(100vh-8rem)]"
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
              ) : allItems.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No recent items"
                  description="Files and folders you open will appear here"
                />
              ) : viewMode === "grid" ? (
                /* Grid View - Folders first (compact), then Files */
                <div className="space-y-6">
                  {/* Folders Section */}
                  {recentFolders.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Folders</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {recentFolders.map((folder) => {
                          const index = allItems.findIndex((i) => i.type === "folder" && i.id === folder.id);
                          return (
                            <DraggableFolderItem
                              key={`folder-${folder.id}`}
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
                              selectionMode={selectionMode}
                              selectedCount={selectedItems.size}
                              onBulkDelete={handleBulkDelete}
                              onBulkMove={handleBulkMove}
                              showOwner
                              owner={user?.name ? { id: user.id, name: user.name } : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Files Section */}
                  {recentAssets.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Files</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {recentAssets.map((asset) => {
                          const index = allItems.findIndex((i) => i.type === "asset" && i.id === asset.id);
                          return (
                            <DraggableFileItem
                              key={`asset-${asset.id}`}
                              asset={asset}
                              onDownload={handleDownload}
                              onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                              onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                              onMove={(a) => handleMove(a, "asset")}
                              onStar={handleStarAsset}
                              onPreview={handlePreview}
                              viewMode={viewMode}
                              index={index}
                              isSelected={selectedItems.has(`asset-${asset.id}`)}
                              isPendingSelection={pendingSelection.has(`asset-${asset.id}`)}
                              onSelect={handleSelectAsset}
                              selectionMode={selectionMode}
                              selectedCount={selectedItems.size}
                              onBulkDownload={handleBulkDownload}
                              onBulkDelete={handleBulkDelete}
                              onBulkMove={handleBulkMove}
                              showOwner
                              owner={user?.name ? { id: user.id, name: user.name } : undefined}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* List View - Combined */
                <div className="flex flex-col">
                  <ListHeader columns={FILE_LIST_COLUMNS} />
                  {allItems.map((item, index) => (
                    item.type === "folder" ? (
                      <DraggableFolderItem
                        key={`folder-${item.id}`}
                        folder={item.data as Folder}
                        onOpen={handleNavigate}
                        onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                        onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                        onMove={(f) => handleMove(f, "folder")}
                        onStar={handleStarFolder}
                        viewMode={viewMode}
                        index={index}
                        isSelected={selectedItems.has(`folder-${item.id}`)}
                        isPendingSelection={pendingSelection.has(`folder-${item.id}`)}
                        onSelect={handleSelectFolder}
                        selectionMode={selectionMode}
                        selectedCount={selectedItems.size}
                        onBulkDelete={handleBulkDelete}
                        onBulkMove={handleBulkMove}
                        showOwner
                        owner={user?.name ? { id: user.id, name: user.name } : undefined}
                      />
                    ) : (
                      <DraggableFileItem
                        key={`asset-${item.id}`}
                        asset={item.data as Asset}
                        onDownload={handleDownload}
                        onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                        onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                        onMove={(a) => handleMove(a, "asset")}
                        onStar={handleStarAsset}
                        onPreview={handlePreview}
                        viewMode={viewMode}
                        index={index}
                        isSelected={selectedItems.has(`asset-${item.id}`)}
                        isPendingSelection={pendingSelection.has(`asset-${item.id}`)}
                        onSelect={handleSelectAsset}
                        selectionMode={selectionMode}
                        selectedCount={selectedItems.size}
                        onBulkDownload={handleBulkDownload}
                        onBulkDelete={handleBulkDelete}
                        onBulkMove={handleBulkMove}
                        showOwner
                        owner={user?.name ? { id: user.id, name: user.name } : undefined}
                      />
                    )
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80 bg-card border border-border/60 rounded-lg p-4 flex items-center gap-3">
              <Clock className="h-6 w-6" />
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
        assets={recentAssets}
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
