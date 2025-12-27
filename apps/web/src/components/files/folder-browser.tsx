"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { Upload, Folder as FolderIcon } from "lucide-react";
import { FileBrowserSkeleton } from "@/components/loaders";
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
import {
  CreateFolderDialog,
  RenameDialog,
  DeleteDialog,
  MoveDialog,
} from "@/components/dialog";
import { EmptyState, ListHeader, InfiniteScrollTrigger } from "@/components/shared";
import { toast } from "sonner";
import type { Folder, Asset } from "@/types";
import { AppHeader } from "@/components/layouts";
import { assetService } from "@/services";
import { useFileActions } from "@/contexts";

interface FolderBrowserProps {
  initialFolderId?: string | null;
}

const FILE_LIST_COLUMNS = [
  { label: "", width: "w-8" },
  { label: "Name" },
  { label: "Size", width: "w-24", align: "right" as const, hideBelow: "sm" as const },
  { label: "Modified", width: "w-32", align: "right" as const, hideBelow: "md" as const },
  { label: "", width: "w-10" },
];

export function FolderBrowser({ initialFolderId = null }: FolderBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [moveItem, setMoveItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeItem, setActiveItem] = useState<{ id: string; type: "folder" | "asset"; data: Folder | Asset } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const { registerUploadTrigger, registerCreateFolderTrigger, setIsUploading } = useFileActions();

  // Register triggers for sidebar actions
  useEffect(() => {
    registerUploadTrigger(() => fileInputRef.current?.click());
    registerCreateFolderTrigger(() => setCreateFolderOpen(true));
  }, [registerUploadTrigger, registerCreateFolderTrigger]);

  // Sync uploading state with context
  useEffect(() => {
    setIsUploading(uploadingCount > 0);
  }, [uploadingCount, setIsUploading]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const { data: allFolders = [], refetch: refetchFolders } = useFolders();
  const { data: folders = [], isLoading: foldersLoading } = useFolderContents(currentFolderId);
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

  const assets = useMemo(() => {
    if (!assetsData?.pages) return [];
    return assetsData.pages.flatMap((page) => page.assets);
  }, [assetsData]);

  const isLoading = foldersLoading || assetsLoading;

  const handleNavigate = (folderId: string | null) => setCurrentFolderId(folderId);

  const handleDownload = async (asset: Asset) => {
    try {
      const { url } = await assetService.getDownloadUrl(asset.id);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to get download URL");
    }
  };

  const handleMove = (item: Folder | Asset, type: "folder" | "asset") => setMoveItem({ item, type });

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
            onError: () => toast.error("Failed to move folder"),
          }
        );
      } else {
        const asset = activeData.item as Asset;
        if (asset.folderId === targetFolderId) return;
        updateAsset.mutate(
          { id: asset.id, input: { folderId: targetFolderId } },
          {
            onSuccess: () => { toast.success("File moved"); refetchAssets(); },
            onError: () => toast.error("Failed to move file"),
          }
        );
      }
    },
    [moveFolder, updateAsset, refetchFolders, refetchAssets]
  );

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
            onProgress: (progress) => toast.loading(`Uploading ${file.name}... ${progress}%`, { id: toastId }),
          },
          {
            onSuccess: () => {
              successCount++;
              setUploadingCount((prev) => prev - 1);
              toast.success(`${file.name} uploaded`, { id: toastId });
              if (successCount + failCount === totalFiles) refetchAssets();
            },
            onError: () => {
              failCount++;
              setUploadingCount((prev) => prev - 1);
              toast.error(`Failed to upload ${file.name}`, { id: toastId });
              if (successCount + failCount === totalFiles) refetchAssets();
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

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
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
      if (files.length > 0) processFiles(files);
    },
    [processFiles]
  );

  return (
    <div className="flex flex-col h-full overflow-clip">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

      <AppHeader
        breadcrumbPath={allFolders.filter((f) => f.id === currentFolderId)}
        handleNavigate={handleNavigate}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div
          className={cn("flex-1 min-h-0 relative transition-colors", isDragging && "bg-primary/5")}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
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
                <FileBrowserSkeleton viewMode={viewMode} />
              ) : folders.length === 0 && assets.length === 0 ? (
                <EmptyState
                  icon={FolderIcon}
                  title="This folder is empty"
                  description="Create a folder or upload files to get started"
                />
              ) : (
                <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "flex flex-col"}>
                  {viewMode === "list" && <ListHeader columns={FILE_LIST_COLUMNS} />}
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

              {!isLoading && (folders.length > 0 || assets.length > 0) && (
                <InfiniteScrollTrigger
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  fetchNextPage={fetchNextPage}
                  endMessage="No more files"
                />
              )}
            </div>
          </ScrollArea>
        </div>

        <DragOverlay>
          {activeItem ? (
            <div className="opacity-80 bg-card border border-border/60 rounded-lg p-4 flex items-center gap-3">
              <FolderIcon className="h-6 w-6" />
              <span className="font-medium">{activeItem.data.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CreateFolderDialog open={createFolderOpen} onOpenChange={setCreateFolderOpen} parentId={currentFolderId} />
      <RenameDialog open={!!renameItem} onOpenChange={(open) => !open && setRenameItem(null)} item={renameItem?.item ?? null} itemType={renameItem?.type ?? "folder"} />
      <DeleteDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)} item={deleteItem?.item ?? null} itemType={deleteItem?.type ?? "folder"} />
      <MoveDialog open={!!moveItem} onOpenChange={(open) => !open && setMoveItem(null)} item={moveItem?.item ?? null} itemType={moveItem?.type ?? "folder"} />
    </div>
  );
}
