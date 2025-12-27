"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Upload, Folder as FolderIcon, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
  useFolderContents,
  useFolders,
  useInfiniteAssets,
  useUploadFile,
  useMoveFolder,
  useUpdateAsset,
} from "@/hooks";
import { DraggableFolderItem } from "./draggable-folder-item";
import { DraggableFileItem } from "./draggable-file-item";
import { CreateFolderDialog } from "./create-folder-dialog";
import { RenameDialog } from "./rename-dialog";
import { DeleteDialog } from "./delete-dialog";
import { MoveDialog } from "./move-dialog";
import { toast } from "sonner";
import type { Folder, Asset } from "@/types";
import AppHeader from "@/components/app-header";
import { assetService } from "@/services";

interface FolderBrowserProps {
  initialFolderId?: string | null;
}

export function FolderBrowser({ initialFolderId = null }: FolderBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(
    initialFolderId
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{
    item: Folder | Asset;
    type: "folder" | "asset";
  } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{
    item: Folder | Asset;
    type: "folder" | "asset";
  } | null>(null);
  const [moveItem, setMoveItem] = useState<{
    item: Folder | Asset;
    type: "folder" | "asset";
  } | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeItem, setActiveItem] = useState<{
    id: string;
    type: "folder" | "asset";
    data: Folder | Asset;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // DnD sensors - add distance threshold to distinguish from clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const { data: allFolders = [], refetch: refetchFolders } = useFolders();
  const { data: folders = [], isLoading: foldersLoading } =
    useFolderContents(currentFolderId);
  const {
    data: assetsData,
    isLoading: assetsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchAssets,
  } = useInfiniteAssets({ folderId: currentFolderId ?? undefined });
  const uploadFile = useUploadFile();
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();

  // Flatten paginated assets
  const assets = useMemo(() => {
    if (!assetsData?.pages) return [];
    return assetsData.pages.flatMap((page) => page.assets);
  }, [assetsData]);

  const isLoading = foldersLoading || assetsLoading;

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

  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId);
  };

  const handleDownload = async (asset: Asset) => {
    try {
      const { url } = await assetService.getDownloadUrl(asset.id);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to get download URL");
    }
  };

  const handleMove = (item: Folder | Asset, type: "folder" | "asset") => {
    setMoveItem({ item, type });
  };

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as { type: "folder" | "asset"; item: Folder | Asset };
    setActiveItem({
      id: active.id as string,
      type: data.type,
      data: data.item,
    });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveItem(null);

      if (!over) return;

      const activeData = active.data.current as { type: "folder" | "asset"; item: Folder | Asset };
      const overId = over.id as string;

      // Determine target folder ID
      let targetFolderId: string | null = null;
      if (overId === "root-drop-zone") {
        targetFolderId = null;
      } else if (overId.startsWith("folder-")) {
        targetFolderId = overId.replace("folder-", "");
      } else {
        return; // Invalid drop target
      }

      // Don't move to same location
      if (activeData.type === "folder") {
        const folder = activeData.item as Folder;
        if (folder.parentId === targetFolderId) return;
        if (folder.id === targetFolderId) return; // Can't move to itself

        moveFolder.mutate(
          { id: folder.id, input: { parentId: targetFolderId } },
          {
            onSuccess: () => {
              toast.success("Folder moved");
              refetchFolders();
            },
            onError: () => {
              toast.error("Failed to move folder");
            },
          }
        );
      } else {
        const asset = activeData.item as Asset;
        if (asset.folderId === targetFolderId) return;

        updateAsset.mutate(
          { id: asset.id, input: { folderId: targetFolderId } },
          {
            onSuccess: () => {
              toast.success("File moved");
              refetchAssets();
            },
            onError: () => {
              toast.error("Failed to move file");
            },
          }
        );
      }
    },
    [moveFolder, updateAsset, refetchFolders, refetchAssets]
  );

  // File upload logic
  const processFiles = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const totalFiles = files.length;
      let successCount = 0;
      let failCount = 0;

      setUploadingCount((prev) => prev + totalFiles);

      for (const file of files) {
        const toastId = toast.loading(`Uploading ${file.name}... 0%`);

        uploadFile.mutate(
          {
            file,
            folderId: currentFolderId ?? undefined,
            onProgress: (progress) => {
              toast.loading(`Uploading ${file.name}... ${progress}%`, {
                id: toastId,
              });
            },
          },
          {
            onSuccess: () => {
              successCount++;
              setUploadingCount((prev) => prev - 1);
              toast.success(`${file.name} uploaded`, { id: toastId });
              if (successCount + failCount === totalFiles) {
                refetchAssets();
              }
            },
            onError: () => {
              failCount++;
              setUploadingCount((prev) => prev - 1);
              toast.error(`Failed to upload ${file.name}`, { id: toastId });
              if (successCount + failCount === totalFiles) {
                refetchAssets();
              }
            },
          }
        );
      }
    },
    [currentFolderId, uploadFile, refetchAssets]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    processFiles(Array.from(files));
    e.target.value = "";
  };

  // External file drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFiles(files);
      }
    },
    [processFiles]
  );

  return (
    <div className="flex flex-col h-full overflow-clip">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
      />

      {/* Header */}
      <AppHeader
        breadcrumbPath={allFolders.filter((f) => f.id === currentFolderId)}
        handleNavigate={handleNavigate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        handleUploadClick={() => fileInputRef.current?.click()}
        setCreateFolderOpen={setCreateFolderOpen}
        uploadingCount={uploadingCount}
      />

      {/* Content with Drag & Drop */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={cn(
            "flex-1 min-h-0 relative transition-colors",
            isDragging && "bg-primary/5"
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* External file drop overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm border-2 border-dashed border-primary rounded-lg m-2">
              <div className="flex flex-col items-center gap-2 text-primary">
                <Upload className="h-12 w-12" />
                <p className="text-lg font-medium">Drop files here to upload</p>
              </div>
            </div>
          )}

          <ScrollArea className="h-full">
            <div className="p-6">
              {isLoading ? (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                      : "space-y-2"
                  }
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className={viewMode === "grid" ? "h-24" : "h-16"}
                    />
                  ))}
                </div>
              ) : folders.length === 0 && assets.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <p className="text-lg">This folder is empty</p>
                  <p className="text-sm">
                    Create a folder or upload files to get started
                  </p>
                </div>
              ) : (
                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                      : "flex flex-col"
                  }
                >
                  {/* List view header */}
                  {viewMode === "list" && (
                    <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b border-border/60 mb-1">
                      <div className="w-8" /> {/* Icon space */}
                      <div className="flex-1 min-w-0">Name</div>
                      <div className="w-24 text-right hidden sm:block">Size</div>
                      <div className="w-32 text-right hidden md:block">Modified</div>
                      <div className="w-10" /> {/* Actions space */}
                    </div>
                  )}
                  {/* Folders - draggable and droppable */}
                  {folders.map((folder, index) => (
                    <DraggableFolderItem
                      key={folder.id}
                      folder={folder}
                      onOpen={handleNavigate}
                      onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                      onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                      onMove={(f) => handleMove(f, "folder")}
                      viewMode={viewMode}
                      index={index}
                    />
                  ))}
                  {/* Files - draggable only */}
                  {assets.map((asset, index) => (
                    <DraggableFileItem
                      key={asset.id}
                      asset={asset}
                      onDownload={handleDownload}
                      onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                      onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                      onMove={(a) => handleMove(a, "asset")}
                      viewMode={viewMode}
                      index={folders.length + index}
                    />
                  ))}
                </div>
              )}

              {/* Infinite scroll trigger */}
              {!isLoading && (folders.length > 0 || assets.length > 0) && (
                <div ref={loadMoreRef} className="w-full py-4 flex justify-center">
                  {isFetchingNextPage && (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  )}
                  {!hasNextPage && assets.length > 0 && (
                    <p className="text-sm text-muted-foreground">No more files</p>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80 bg-card border rounded-lg p-4 shadow-lg flex items-center gap-3">
              <FolderIcon className="h-6 w-6 text-blue-500" />
              <span className="font-medium">{activeItem.data.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        parentId={currentFolderId}
      />
      <RenameDialog
        open={!!renameItem}
        onOpenChange={(open) => !open && setRenameItem(null)}
        item={renameItem?.item ?? null}
        itemType={renameItem?.type ?? "folder"}
      />
      <DeleteDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        item={deleteItem?.item ?? null}
        itemType={deleteItem?.type ?? "folder"}
      />
      <MoveDialog
        open={!!moveItem}
        onOpenChange={(open) => !open && setMoveItem(null)}
        item={moveItem?.item ?? null}
        itemType={moveItem?.type ?? "folder"}
      />
    </div>
  );
}
