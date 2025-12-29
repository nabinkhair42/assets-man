"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Users, Download, MoreVertical, Folder, ExternalLink } from "lucide-react";
import { FileBrowserSkeleton } from "@/components/loaders";
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
import { cn } from "@/lib/utils";
import { useSharedWithMe, useMarqueeSelection } from "@/hooks";
import { FilePreviewDialog } from "@/components/dialog";
import { EmptyState, ListHeader, SelectionToolbar, type SelectedItem, FileIcon } from "@/components/shared";
import { SingleAvatar } from "@/components/ui/avatar-group";
import { toast } from "sonner";
import type { Asset } from "@/types";
import { AppHeader } from "@/components/layouts";
import { assetService } from "@/services";
import { useRouter } from "next/navigation";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";

const FILE_LIST_COLUMNS = [
  { label: "Name" },
  { label: "Owner", width: "w-40", align: "left" as const, hideBelow: "sm" as const },
  { label: "Size", width: "w-24", align: "right" as const, hideBelow: "md" as const },
  { label: "Shared", width: "w-32", align: "right" as const, hideBelow: "lg" as const },
  { label: "", width: "w-10" },
];

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
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
    } catch {
      toast.error("Failed to download file");
    }
  };

  const handleOpen = useCallback((item: SharedItem) => {
    if (item.type === "folder") {
      // Navigate to folder
      handleNavigate(item.itemId);
    } else {
      // Find the share to get asset details
      const share = shares.find((s) => s.id === item.shareId);
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
  }, [shares, handleNavigate]);

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
      // id format is "folder-{id}" or "asset-{id}"
      const [type, ...idParts] = id.split("-");
      const itemId = idParts.join("-");
      const item = allItems.find((i) => i.type === type && i.id === itemId);
      if (item) {
        newSelection.set(id, { id: itemId, type: item.type as "folder" | "asset", name: item.name });
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

    for (const item of assetItems) {
      const sharedItem = allItems.find((i) => i.id === item.id);
      if (sharedItem) {
        await handleDownload(sharedItem);
      }
    }
    handleClearSelection();
  }, [selectedItems, allItems, handleClearSelection]);

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
                  icon={Users}
                  title="Nothing shared with you yet"
                  description="Files and folders shared with you will appear here"
                />
              ) : viewMode === "list" ? (
                <div className="flex flex-col">
                  <ListHeader columns={FILE_LIST_COLUMNS} />
                  {allItems.map((item, index) => (
                    <ContextMenu key={item.id} onOpenChange={(open) => handleContextMenuOpen(item, open)}>
                      <ContextMenuTrigger>
                        <div
                          data-item-id={`${item.type}-${item.id}`}
                          onClick={(e) => handleItemSelect(index, item.id, item.type, item.name, !selectedItems.has(`${item.type}-${item.id}`), e.shiftKey)}
                          onDoubleClick={() => handleOpen(item)}
                          className={cn(
                            "group flex cursor-pointer items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 transition-all duration-150",
                            "hover:bg-accent/50 rounded-lg",
                            pendingSelection.has(`${item.type}-${item.id}`) && "bg-primary/20 ring-2 ring-primary ring-inset",
                            selectedItems.has(`${item.type}-${item.id}`) && "bg-primary/15 ring-2 ring-primary/60 ring-inset"
                          )}
                        >
                          <FileIcon
                            isFolder={item.type === "folder"}
                            mimeType={item.mimeType ?? undefined}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium text-sm text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">
                              {item.ownerName} · {item.permission === "edit" ? "Can edit" : "Can view"}
                            </p>
                          </div>
                          <div className="w-40 hidden sm:flex items-center gap-2">
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
                          </div>
                          <div className="w-24 text-right text-sm text-muted-foreground hidden md:block">
                            {item.type === "asset" && item.size ? formatFileSize(item.size) : "—"}
                          </div>
                          <div className="w-32 text-right text-sm text-muted-foreground hidden lg:block">
                            {formatRelativeTime(new Date(item.createdAt))}
                          </div>
                          <div className="w-10 flex justify-end">
                            {renderDropdownMenu(item)}
                          </div>
                        </div>
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
                </div>
              ) : (
                /* Grid View - Folders first (compact), then Files */
                <div className="space-y-6">
                  {/* Folders Section */}
                  {sharedFolders.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Folders</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                        {sharedFolders.map((item, index) => (
                          <ContextMenu key={item.id} onOpenChange={(open) => handleContextMenuOpen(item, open)}>
                            <ContextMenuTrigger>
                              <div
                                data-item-id={`${item.type}-${item.id}`}
                                onClick={(e) => handleItemSelect(index, item.id, item.type, item.name, !selectedItems.has(`${item.type}-${item.id}`), e.shiftKey)}
                                onDoubleClick={() => handleOpen(item)}
                                className={cn(
                                  "group relative cursor-pointer rounded-lg border border-border/40 bg-card transition-all duration-150",
                                  "hover:border-border hover:bg-accent/30",
                                  pendingSelection.has(`${item.type}-${item.id}`) && "border-primary bg-primary/5",
                                  selectedItems.has(`${item.type}-${item.id}`) && "border-primary/60 bg-primary/5"
                                )}
                              >
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                  <Folder className="h-5 w-5 text-muted-foreground shrink-0" />
                                  <span className="flex-1 truncate text-sm font-medium" title={item.name}>
                                    {item.name}
                                  </span>
                                  {selectedItems.has(`${item.type}-${item.id}`) ? (
                                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {renderDropdownMenu(item)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </ContextMenuTrigger>
                            <ContextMenuContent>
                              <ContextMenuItem onClick={() => handleOpen(item)}>
                                <Folder className="mr-2 h-4 w-4" />
                                Open Folder
                              </ContextMenuItem>
                            </ContextMenuContent>
                          </ContextMenu>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Files Section */}
                  {sharedFiles.length > 0 && (
                    <div>
                      <h3 className="text-xs font-medium text-muted-foreground tracking-wider mb-3">Files</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {sharedFiles.map((item, index) => (
                          <ContextMenu key={item.id} onOpenChange={(open) => handleContextMenuOpen(item, open)}>
                            <ContextMenuTrigger>
                              <div
                                data-item-id={`${item.type}-${item.id}`}
                                onClick={(e) => handleItemSelect(sharedFolders.length + index, item.id, item.type, item.name, !selectedItems.has(`${item.type}-${item.id}`), e.shiftKey)}
                                onDoubleClick={() => handleOpen(item)}
                                className={cn(
                                  "group relative cursor-pointer rounded-xl border border-transparent transition-all duration-200",
                                  "hover:border-border/60 hover:shadow-lg hover:shadow-black/5",
                                  pendingSelection.has(`${item.type}-${item.id}`) && "border-primary bg-primary/5",
                                  selectedItems.has(`${item.type}-${item.id}`) && "border-primary/60 bg-primary/5 shadow-md shadow-primary/10"
                                )}
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
                                    <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    </div>
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
                              </div>
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
                      </div>
                    </div>
                  )}
                </div>
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
