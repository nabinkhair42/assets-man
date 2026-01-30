"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Users, Download, MoreVertical, Folder, ExternalLink } from "lucide-react";
import { FileBrowserSkeleton } from "@/components/loaders/file-browser-skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { useSharedWithMe } from "@/hooks/use-shares";
import { useMarqueeSelection } from "@/hooks/use-marquee-selection";
import { useKeyboardShortcuts, type KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { useViewMode } from "@/hooks/use-view-mode";
import { FilePreviewDialog } from "@/components/dialog/file-preview-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { SelectionToolbar, type SelectedItem } from "@/components/shared/selection-toolbar";
import { SHARED_LIST_COLUMNS } from "@/components/shared/list-columns";
import { FileIcon } from "@/components/shared/file-icon";
import { DataList, DataListHeader, DataListRow, DataListCell, DataGrid, DataGridSection, DataGridFolderContainer, DataGridFileContainer, DataGridFolderCard, DataGridFileCard, SelectionCheckmark } from "@/components/ui/data-list";
import { SingleAvatar } from "@/components/ui/avatar-group";
import { toast } from "sonner";
import type { Asset } from "@/types/asset";
import AppHeader from "@/components/layouts/app-header";
import { assetService } from "@/services/asset-service";
import { useRouter } from "next/navigation";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";

interface SharedItem {
  id: string;
  shareId: string;
  itemId: string;
  type: "folder" | "asset";
  name: string;
  permission: "view" | "edit";
  ownerName: string;
  ownerId: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

export default function SharedWithMePage() {
  const router = useRouter();
  const { viewMode, setViewMode } = useViewMode();
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const lastSelectedIndex = useRef<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const { data: shares = [], isLoading } = useSharedWithMe();

  // Build list of items from shares
  const allItems = useMemo<SharedItem[]>(() => {
    return shares.map((share) => ({
      id: share.id,
      shareId: share.id,
      itemId: share.folderId ?? share.assetId ?? "",
      type: share.itemType,
      name: share.itemName,
      permission: share.permission,
      ownerName: share.ownerName ?? "Unknown",
      ownerId: share.ownerId,
      mimeType: share.mimeType,
      size: share.size,
      createdAt: share.createdAt,
    }));
  }, [shares]);

  // Separate folders and files for grid view
  const sharedFolders = useMemo(() => allItems.filter((item) => item.type === "folder"), [allItems]);
  const sharedFiles = useMemo(() => allItems.filter((item) => item.type === "asset"), [allItems]);

  // Index maps for O(1) lookups
  const allItemIndex = useMemo(() => {
    const map = new Map<string, { item: SharedItem; index: number }>();
    allItems.forEach((item, index) => map.set(`${item.type}-${item.id}`, { item, index }));
    map.forEach(({ item }) => map.set(item.id, { item, index: 0 }));
    return map;
  }, [allItems]);
  const sharesById = useMemo(() => new Map(shares.map((s) => [s.id, s])), [shares]);

  const handleNavigate = (folderId: string | null) => {
    if (folderId) {
      router.push(`/files?folderId=${folderId}`);
    } else {
      router.push("/files");
    }
  };

  const handleDownload = async (item: SharedItem) => {
    if (item.type === "folder") {
      toast.info("Folder download is not supported");
      return;
    }

    try {
      const { url } = await assetService.getSharedDownloadUrl(item.itemId);
      const link = document.createElement("a");
      link.href = url;
      link.download = item.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  };

  const handleOpen = useCallback((item: SharedItem) => {
    if (item.type === "folder") {
      handleNavigate(item.itemId);
    } else {
      const share = sharesById.get(item.shareId);
      if (share && share.assetId) {
        setPreviewAsset({
          id: share.assetId,
          name: share.itemName,
          originalName: share.itemName,
          mimeType: share.mimeType ?? "application/octet-stream",
          size: share.size ?? 0,
          ownerId: share.ownerId,
          folderId: null,
          storageKey: "",
          thumbnailKey: null,
          isStarred: false,
          trashedAt: null,
          createdAt: share.createdAt,
          updatedAt: share.updatedAt,
        });
      }
    }
  }, [sharesById, handleNavigate]);

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
        newSelection.set(id, { id: entry.item.id, type: entry.item.type as "folder" | "asset", name: entry.item.name });
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
  });

  // Auto-select on context menu open (Google Drive behavior)
  const handleContextMenuOpen = useCallback((item: SharedItem, open: boolean) => {
    if (open && !selectedItems.has(`${item.type}-${item.id}`)) {
      const key = `${item.type}-${item.id}`;
      setSelectedItems(new Map([[key, { id: item.id, type: item.type, name: item.name }]]));
    }
  }, [selectedItems]);

  const handleBulkDownload = useCallback(async () => {
    const assetItems = Array.from(selectedItems.values()).filter((item) => item.type === "asset");
    if (assetItems.length === 0) {
      toast.info("No files selected for download");
      return;
    }

    // Get the actual item IDs (not share IDs)
    const assetIds: string[] = [];
    for (const item of assetItems) {
      const entry = allItemIndex.get(item.id);
      if (entry?.item.itemId) assetIds.push(entry.item.itemId);
    }

    if (assetIds.length === 0) {
      toast.info("No files selected for download");
      return;
    }

    const toastId = toast.loading("Preparing download");
    try {
      const blob = await assetService.sharedBulkDownload(assetIds);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `shared-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started", { id: toastId });
      handleClearSelection();
    } catch (error) {
      toast.error(getApiErrorMessage(error), { id: toastId });
    }
  }, [selectedItems, allItemIndex, handleClearSelection]);

  const handleSelectAll = useCallback(() => {
    const newSelection = new Map<string, SelectedItem>();
    for (const item of allItems) {
      newSelection.set(`${item.type}-${item.id}`, { id: item.id, type: item.type, name: item.name });
    }
    setSelectedItems(newSelection);
  }, [allItems]);

  const handleKeyboardPreview = useCallback(() => {
    if (selectedItems.size !== 1) return;
    const [selectedKey] = Array.from(selectedItems.keys());
    const entry = allItemIndex.get(selectedKey);
    if (entry) handleOpen(entry.item);
  }, [selectedItems, allItemIndex, handleOpen]);

  // Keyboard shortcuts (limited - shared items can't be deleted/moved/renamed)
  const shortcuts: KeyboardShortcut[] = useMemo(() => [
    {
      key: "a",
      ctrl: true,
      action: handleSelectAll,
      description: "Select all",
      enabled: allItems.length > 0,
    },
    {
      key: "d",
      ctrl: true,
      action: handleBulkDownload,
      description: "Download",
      enabled: selectedItems.size > 0,
    },
    {
      key: "Escape",
      action: handleClearSelection,
      description: "Clear selection",
      enabled: selectedItems.size > 0,
    },
    {
      key: "Enter",
      action: handleKeyboardPreview,
      description: "Preview/Open",
      enabled: selectedItems.size === 1,
    },
  ], [handleSelectAll, handleBulkDownload, handleClearSelection, handleKeyboardPreview, allItems.length, selectedItems.size]);

  useKeyboardShortcuts({ shortcuts, enabled: true });

  const renderDropdownMenu = (item: SharedItem) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleOpen(item)}>
          {item.type === "folder" ? (
            <>
              <Folder className="mr-2 h-4 w-4" />
              Open Folder
            </>
          ) : (
            <>
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </>
          )}
        </DropdownMenuItem>
        {item.type === "asset" && (
          <DropdownMenuItem onClick={() => handleDownload(item)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full overflow-clip">
        <AppHeader
          breadcrumbPath={[]}
          handleNavigate={handleNavigate}
          viewMode={viewMode}
          setViewMode={setViewMode}
          title="Shared with me"
          onPreviewAsset={(asset) => setPreviewAsset(asset)}
        />

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
                  variant="share"
                  title="Nothing shared with you yet"
                  description="When someone shares files or folders with you, they'll appear here. Share your own files to start collaborating!"
                  actions={[
                    {
                      label: "Browse your files",
                      onClick: () => router.push("/files"),
                    },
                  ]}
                />
              ) : viewMode === "list" ? (
                <DataList>
                  <DataListHeader columns={SHARED_LIST_COLUMNS} />
                  {allItems.map((item, index) => (
                    <ContextMenu key={item.id} onOpenChange={(open) => handleContextMenuOpen(item, open)}>
                      <ContextMenuTrigger>
                        <DataListRow
                          data-item-id={`${item.type}-${item.id}`}
                          onClick={(e) => handleItemSelect(index, item.id, item.type, item.name, !selectedItems.has(`${item.type}-${item.id}`), e.shiftKey)}
                          onDoubleClick={() => handleOpen(item)}
                          selected={selectedItems.has(`${item.type}-${item.id}`)}
                          pending={pendingSelection.has(`${item.type}-${item.id}`)}
                        >
                          <FileIcon
                            isFolder={item.type === "folder"}
                            mimeType={item.mimeType ?? undefined}
                            size="sm"
                          />
                          <DataListCell primary>
                            <p className="truncate font-medium text-sm text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {item.ownerName} · {item.permission === "edit" ? "Can edit" : "Can view"}
                            </p>
                          </DataListCell>
                          <DataListCell width="w-40" hideBelow="sm" className="items-center gap-2">
                            <SingleAvatar
                              user={{ id: item.ownerId, name: item.ownerName }}
                              size="sm"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm text-foreground">{item.ownerName}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.permission === "edit" ? "Can edit" : "View only"}
                              </p>
                            </div>
                          </DataListCell>
                          <DataListCell width="w-24" align="right" hideBelow="md" className="text-sm text-muted-foreground">
                            {item.type === "asset" && item.size ? formatFileSize(item.size) : "—"}
                          </DataListCell>
                          <DataListCell width="w-32" align="right" hideBelow="lg" className="text-sm text-muted-foreground">
                            {formatRelativeTime(new Date(item.createdAt))}
                          </DataListCell>
                          <DataListCell width="w-10" align="right">
                            {renderDropdownMenu(item)}
                          </DataListCell>
                        </DataListRow>
                      </ContextMenuTrigger>
                      <ContextMenuContent>
                        <ContextMenuItem onClick={() => handleOpen(item)}>
                          {item.type === "folder" ? (
                            <>
                              <Folder className="mr-2 h-4 w-4" />
                              Open Folder
                            </>
                          ) : (
                            <>
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Preview
                            </>
                          )}
                        </ContextMenuItem>
                        {item.type === "asset" && (
                          <ContextMenuItem onClick={() => handleDownload(item)}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </ContextMenuItem>
                        )}
                      </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </DataList>
              ) : (
                /* Grid View - Folders first (compact), then Files */
                <DataGrid>
                  {/* Folders Section */}
                  {sharedFolders.length > 0 && (
                    <DataGridSection title="Folders">
                      <DataGridFolderContainer>
                        {sharedFolders.map((item, index) => (
                          <ContextMenu key={item.id} onOpenChange={(open) => handleContextMenuOpen(item, open)}>
                            <ContextMenuTrigger>
                              <DataGridFolderCard
                                data-item-id={`${item.type}-${item.id}`}
                                onClick={(e) => handleItemSelect(index, item.id, item.type, item.name, !selectedItems.has(`${item.type}-${item.id}`), e.shiftKey)}
                                onDoubleClick={() => handleOpen(item)}
                                selected={selectedItems.has(`${item.type}-${item.id}`)}
                                pending={pendingSelection.has(`${item.type}-${item.id}`)}
                              >
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                  <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                                  <span className="flex-1 truncate text-sm font-medium" title={item.name}>
                                    {item.name}
                                  </span>
                                  {selectedItems.has(`${item.type}-${item.id}`) ? (
                                    <SelectionCheckmark />
                                  ) : (
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {renderDropdownMenu(item)}
                                    </div>
                                  )}
                                </div>
                              </DataGridFolderCard>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => handleOpen(item)}>
                                <Folder className="mr-2 h-4 w-4" />
                                Open Folder
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </DataGridFolderContainer>
                    </DataGridSection>
                  )}

                  {/* Files Section */}
                  {sharedFiles.length > 0 && (
                    <DataGridSection title="Files">
                      <DataGridFileContainer>
                        {sharedFiles.map((item, index) => (
                          <ContextMenu key={item.id} onOpenChange={(open) => handleContextMenuOpen(item, open)}>
                            <ContextMenuTrigger>
                              <DataGridFileCard
                                data-item-id={`${item.type}-${item.id}`}
                                onClick={(e) => handleItemSelect(sharedFolders.length + index, item.id, item.type, item.name, !selectedItems.has(`${item.type}-${item.id}`), e.shiftKey)}
                                onDoubleClick={() => handleOpen(item)}
                                selected={selectedItems.has(`${item.type}-${item.id}`)}
                                pending={pendingSelection.has(`${item.type}-${item.id}`)}
                              >
                                {/* Preview area */}
                                <div className="relative aspect-[4/3] rounded-t-xl bg-muted/50 overflow-hidden">
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <FileIcon mimeType={item.mimeType ?? undefined} size="xl" />
                                  </div>
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {renderDropdownMenu(item)}
                                  </div>
                                  {selectedItems.has(`${item.type}-${item.id}`) && (
                                    <SelectionCheckmark className="absolute bottom-2 right-2" />
                                  )}
                                </div>
                                {/* Info area */}
                                <div className="p-3">
                                  <p className="truncate font-medium text-sm text-foreground mb-1" title={item.name}>
                                    {item.name}
                                  </p>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <SingleAvatar user={{ id: item.ownerId, name: item.ownerName }} size="xs" showTooltip={false} />
                                    <span className="text-xs text-muted-foreground truncate">{item.ownerName}</span>
                                  </div>
                                </div>
                              </DataGridFileCard>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => handleOpen(item)}>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Preview
                              </ContextMenuItem>
                              <ContextMenuItem onClick={() => handleDownload(item)}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </DataGridFileContainer>
                    </DataGridSection>
                  )}
                </DataGrid>
              )}
            </div>
          </ScrollArea>
        </div>

        <FilePreviewDialog
          open={!!previewAsset}
          onOpenChange={(open) => !open && setPreviewAsset(null)}
          asset={previewAsset}
          assets={[]}
          onNavigate={() => {}}
          getDownloadUrl={assetService.getSharedDownloadUrl}
        />

        <SelectionToolbar
          selectedItems={Array.from(selectedItems.values())}
          onClearSelection={handleClearSelection}
          onDelete={() => toast.info("Cannot delete shared items")}
          onMove={() => toast.info("Cannot move shared items")}
          onDownload={handleBulkDownload}
        />
      </div>
    </TooltipProvider>
  );
}
