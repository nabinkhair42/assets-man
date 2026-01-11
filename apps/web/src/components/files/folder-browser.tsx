"use client";

import { useState, useRef, useCallback, useMemo, useEffect, useTransition } from "react";
import { Upload, Folder as FolderIcon, FolderPlus, CheckSquare, RefreshCw } from "lucide-react";
import { FileBrowserSkeleton } from "@/components/loaders";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "@/components/ui/context-menu";
import { cn, getApiErrorMessage } from "@/lib/utils";
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
  useToggleAssetStarred,
  useToggleFolderStarred,
  useMarqueeSelection,
  useUser,
  useFileBrowserShortcuts,
  useViewMode,
} from "@/hooks";
import { DraggableFolderItem } from "./draggable-folder-item";
import { DraggableFileItem } from "./draggable-file-item";
import {
  BulkDeleteDialog,
  BulkMoveDialog,
  CopyDialog,
  CreateFolderDialog,
  RenameDialog,
  DeleteDialog,
  MoveDialog,
  FilePreviewDialog,
  ShareDialog,
} from "@/components/dialog";
import { EmptyState, InfiniteScrollTrigger, SelectionToolbar, MobileFab, FILE_LIST_COLUMNS, type SelectedItem } from "@/components/shared";
import { DataList, DataListHeader, DataGrid, DataGridSection, DataGridFolderContainer, DataGridFileContainer } from "@/components/ui/data-list";
import { toast } from "sonner";
import type { Folder, Asset } from "@/types";
import { AppHeader, type SortConfig } from "@/components/layouts";
import { assetService, recentService, folderService } from "@/services";
import { useFileActions } from "@/contexts";

// Types for FileSystem API (folder drag & drop)
interface FileWithPath {
  file: File;
  relativePath: string;
}

interface FolderStructure {
  name: string;
  path: string;
  children: FolderStructure[];
}

// Helper function to read all entries from a directory
async function readAllDirectoryEntries(directoryReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  const entries: FileSystemEntry[] = [];
  let batch: FileSystemEntry[];

  do {
    batch = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      directoryReader.readEntries(resolve, reject);
    });
    entries.push(...batch);
  } while (batch.length > 0);

  return entries;
}

// Recursively read a folder entry and collect all files with their paths
async function readFolderEntry(
  entry: FileSystemDirectoryEntry,
  basePath: string = ""
): Promise<{ files: FileWithPath[]; folders: FolderStructure }> {
  const files: FileWithPath[] = [];
  const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;
  const folderStructure: FolderStructure = {
    name: entry.name,
    path: currentPath,
    children: [],
  };

  const directoryReader = entry.createReader();
  const entries = await readAllDirectoryEntries(directoryReader);

  for (const childEntry of entries) {
    if (childEntry.isFile) {
      const fileEntry = childEntry as FileSystemFileEntry;
      const file = await new Promise<File>((resolve, reject) => {
        fileEntry.file(resolve, reject);
      });
      files.push({ file, relativePath: `${currentPath}/${file.name}` });
    } else if (childEntry.isDirectory) {
      const dirEntry = childEntry as FileSystemDirectoryEntry;
      const result = await readFolderEntry(dirEntry, currentPath);
      files.push(...result.files);
      folderStructure.children.push(result.folders);
    }
  }

  return { files, folders: folderStructure };
}

// Create folder structure recursively and return a map of path -> folderId
async function createFolderStructure(
  structure: FolderStructure,
  parentFolderId: string | null,
  folderMap: Map<string, string> = new Map()
): Promise<Map<string, string>> {
  const createdFolder = await folderService.create({
    name: structure.name,
    parentId: parentFolderId ?? undefined,
  });

  folderMap.set(structure.path, createdFolder.id);

  for (const child of structure.children) {
    await createFolderStructure(child, createdFolder.id, folderMap);
  }

  return folderMap;
}

interface FolderBrowserProps {
  initialFolderId?: string | null;
}

export function FolderBrowser({ initialFolderId = null }: FolderBrowserProps) {
  const { data: user } = useUser();
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const { viewMode, setViewMode } = useViewMode();
  const [sortConfig, setSortConfig] = useState<SortConfig>({ sortBy: "createdAt", sortOrder: "desc" });
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [moveItem, setMoveItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [copyItem, setCopyItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [shareItem, setShareItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [activeItem, setActiveItem] = useState<{ id: string; type: "folder" | "asset"; data: Folder | Asset } | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map());
  const [isNavigating, setIsNavigating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const lastSelectedIndex = useRef<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const { registerUploadTrigger, registerCreateFolderTrigger, setIsUploading } = useFileActions();

  const selectionMode = selectedItems.size > 0;

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

  // Map asset sortBy to folder sortBy (folders don't have size)
  const folderSortBy = sortConfig.sortBy === "size" ? "name" : sortConfig.sortBy;

  const { data: allFolders = [], refetch: refetchFolders } = useFolders();
  const { data: folders = [], isLoading: foldersLoading } = useFolderContents({
    parentId: currentFolderId,
    sortBy: folderSortBy,
    sortOrder: sortConfig.sortOrder,
  });
  const {
    data: assetsData,
    isLoading: assetsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchAssets,
  } = useInfiniteAssets({
    folderId: currentFolderId ?? undefined,
    sortBy: sortConfig.sortBy,
    sortOrder: sortConfig.sortOrder,
  });
  const uploadFile = useUploadFile();
  const moveFolder = useMoveFolder();
  const updateAsset = useUpdateAsset();
  const toggleAssetStarred = useToggleAssetStarred();
  const toggleFolderStarred = useToggleFolderStarred();

  const assets = useMemo(() => {
    if (!assetsData?.pages) return [];
    return assetsData.pages.flatMap((page) => page.assets);
  }, [assetsData]);

  // Combined list of all items for index-based operations
  const allItems = useMemo(() => {
    const items: Array<{ id: string; type: "folder" | "asset"; name: string; data: Folder | Asset }> = [];
    folders.forEach((folder) => items.push({ id: folder.id, type: "folder", name: folder.name, data: folder }));
    assets.forEach((asset) => items.push({ id: asset.id, type: "asset", name: asset.name, data: asset }));
    return items;
  }, [folders, assets]);

  const isLoading = foldersLoading || assetsLoading || isNavigating || isPending;

  // Reset navigation state when data finishes loading
  useEffect(() => {
    if (!foldersLoading && !assetsLoading && isNavigating) {
      // Small delay for smooth transition
      const timer = setTimeout(() => setIsNavigating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [foldersLoading, assetsLoading, isNavigating]);

  const handleNavigate = useCallback((folderId: string | null) => {
    // Show immediate loading feedback
    setIsNavigating(true);

    // Use React transition for smooth state update
    startTransition(() => {
      setCurrentFolderId(folderId);
      // Clear selection when navigating
      setSelectedItems(new Map());
      lastSelectedIndex.current = null;
    });

    // Record folder access for recent items
    if (folderId) {
      recentService.recordAccess({ itemId: folderId, itemType: "folder" }).catch(() => {});
    }
  }, []);

  const handleDownload = async (asset: Asset) => {
    try {
      // Record asset access for recent items (downloads count as access)
      recentService.recordAccess({ itemId: asset.id, itemType: "asset" }).catch(() => {});

      const { url } = await assetService.getDownloadUrl(asset.id);
      // Create a temporary anchor and trigger download
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
        refetchAssets();
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }, [toggleAssetStarred, refetchAssets]);

  const handleStarFolder = useCallback((folder: Folder) => {
    toggleFolderStarred.mutate(folder.id, {
      onSuccess: (data) => {
        toast.success(data.isStarred ? "Added to starred" : "Removed from starred");
        refetchFolders();
      },
      onError: (error) => toast.error(getApiErrorMessage(error)),
    });
  }, [toggleFolderStarred, refetchFolders]);

  const handlePreview = useCallback((asset: Asset) => {
    // Record asset access for recent items
    recentService.recordAccess({ itemId: asset.id, itemType: "asset" }).catch(() => {});
    setPreviewAsset(asset);
  }, []);

  // Selection handlers with shift+click and ctrl+click support
  const handleItemSelect = useCallback((
    index: number,
    id: string,
    type: "folder" | "asset",
    name: string,
    _selected: boolean,
    shiftKey: boolean,
    ctrlKey: boolean
  ) => {
    setSelectedItems((prev) => {
      const key = `${type}-${id}`;

      if (shiftKey && lastSelectedIndex.current !== null) {
        // Shift+Click: Range selection from last selected to current
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
        // Ctrl+Click: Toggle item without clearing others (multi-select)
        const next = new Map(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.set(key, { id, type, name });
          lastSelectedIndex.current = index;
        }
        return next;
      } else {
        // Regular click: Clear all and select only this item (or deselect if already selected alone)
        if (prev.size === 1 && prev.has(key)) {
          // If only this item is selected, deselect it
          lastSelectedIndex.current = null;
          return new Map();
        } else {
          // Select only this item
          const next = new Map<string, SelectedItem>();
          next.set(key, { id, type, name });
          lastSelectedIndex.current = index;
          return next;
        }
      }
    });
  }, [allItems]);

  const handleSelectFolder = useCallback((folder: Folder, selected: boolean, shiftKey = false, ctrlKey = false) => {
    const index = allItems.findIndex((item) => item.type === "folder" && item.id === folder.id);
    handleItemSelect(index, folder.id, "folder", folder.name, selected, shiftKey, ctrlKey);
  }, [allItems, handleItemSelect]);

  const handleSelectAsset = useCallback((asset: Asset, selected: boolean, shiftKey = false, ctrlKey = false) => {
    const index = allItems.findIndex((item) => item.type === "asset" && item.id === asset.id);
    handleItemSelect(index, asset.id, "asset", asset.name, selected, shiftKey, ctrlKey);
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
      // id format is "folder-{id}" or "asset-{id}"
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
    disabled: isDragging || !!activeItem,
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
    refetchFolders();
    refetchAssets();
  }, [handleClearSelection, refetchFolders, refetchAssets]);

  const handleBulkDownload = useCallback(async () => {
    const items = Array.from(selectedItems.values());
    const assetIds = items.filter((item) => item.type === "asset").map((item) => item.id);
    const folderIds = items.filter((item) => item.type === "folder").map((item) => item.id);

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
      link.download = `download-${Date.now()}.zip`;
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

  const handleRefresh = useCallback(() => {
    refetchFolders();
    refetchAssets();
    toast.success("Refreshed");
  }, [refetchFolders, refetchAssets]);

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

  const processFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const totalFiles = files.length;
      let successCount = 0;
      let failCount = 0;
      setUploadingCount((prev) => prev + totalFiles);

      // Process files concurrently with individual toast tracking
      const uploadPromises = files.map(async (file) => {
        const toastId = toast.loading(`Uploading ${file.name} 0%`);
        try {
          await uploadFile.mutateAsync({
            file,
            folderId: currentFolderId ?? undefined,
            onProgress: (progress) => toast.loading(`Uploading ${file.name} ${progress}%`, { id: toastId }),
          });
          successCount++;
          setUploadingCount((prev) => prev - 1);
          toast.success(`${file.name} uploaded`, { id: toastId });
        } catch (error) {
          failCount++;
          setUploadingCount((prev) => prev - 1);
          toast.error(getApiErrorMessage(error, `Failed to upload ${file.name}`), { id: toastId });
        }
      });

      await Promise.all(uploadPromises);
      refetchAssets();
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

  // Process a dropped folder: create folder structure, then upload files
  const processFolderUpload = useCallback(
    async (entry: FileSystemDirectoryEntry) => {
      const toastId = toast.loading(`Reading folder "${entry.name}"`);

      try {
        // Read all files and folder structure
        const { files, folders } = await readFolderEntry(entry);

        if (files.length === 0) {
          toast.info(`Folder "${entry.name}" is empty`, { id: toastId });
          return;
        }

        toast.loading(`Creating ${folders.children.length + 1} folder(s)`, { id: toastId });

        // Create folder structure and get path -> folderId mapping
        const folderMap = await createFolderStructure(folders, currentFolderId);

        toast.loading(`Uploading ${files.length} file(s)`, { id: toastId });

        // Upload files to their respective folders concurrently
        let successCount = 0;
        let failCount = 0;
        setUploadingCount((prev) => prev + files.length);

        const uploadPromises = files.map(async ({ file, relativePath }) => {
          // Get parent folder path from file's relative path
          const pathParts = relativePath.split("/");
          pathParts.pop(); // Remove filename
          const folderPath = pathParts.join("/");
          const targetFolderId = folderMap.get(folderPath) ?? currentFolderId;

          try {
            await uploadFile.mutateAsync({
              file,
              folderId: targetFolderId ?? undefined,
              onProgress: () => {
                // Progress handled silently for batch uploads
              },
            });
            successCount++;
            setUploadingCount((prev) => prev - 1);
          } catch {
            failCount++;
            setUploadingCount((prev) => prev - 1);
          }
        });

        await Promise.all(uploadPromises);

        refetchFolders();
        refetchAssets();

        if (failCount === 0) {
          toast.success(`Uploaded ${successCount} file(s) from "${entry.name}"`, { id: toastId });
        } else {
          toast.warning(`Uploaded ${successCount} file(s), ${failCount} failed`, { id: toastId });
        }
      } catch (error) {
        console.error("Folder upload error:", error);
        toast.error(getApiErrorMessage(error, `Failed to upload folder "${entry.name}"`), { id: toastId });
      }
    },
    [currentFolderId, uploadFile, refetchFolders, refetchAssets]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      const items = e.dataTransfer.items;
      const regularFiles: File[] = [];
      const folderEntries: FileSystemDirectoryEntry[] = [];

      // Check if any items are folders using webkitGetAsEntry
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const entry = item.webkitGetAsEntry?.();
            if (entry?.isDirectory) {
              folderEntries.push(entry as FileSystemDirectoryEntry);
            } else {
              const file = item.getAsFile();
              if (file) regularFiles.push(file);
            }
          }
        }
      } else {
        // Fallback for browsers without webkitGetAsEntry
        regularFiles.push(...Array.from(e.dataTransfer.files));
      }

      // Process regular files
      if (regularFiles.length > 0) {
        processFiles(regularFiles);
      }

      // Process folders sequentially
      for (const folderEntry of folderEntries) {
        await processFolderUpload(folderEntry);
      }
    },
    [processFiles, processFolderUpload]
  );

  // Keyboard shortcut handlers
  const handleKeyboardStar = useCallback(() => {
    if (selectedItems.size === 0) return;
    const items = Array.from(selectedItems.values());
    // Star first item (for single selection, or toggle all for batch)
    for (const item of items) {
      if (item.type === "folder") {
        const folder = folders.find((f) => f.id === item.id);
        if (folder) toggleFolderStarred.mutate(folder.id);
      } else {
        const asset = assets.find((a) => a.id === item.id);
        if (asset) toggleAssetStarred.mutate(asset.id);
      }
    }
  }, [selectedItems, folders, assets, toggleFolderStarred, toggleAssetStarred]);

  const handleKeyboardRename = useCallback(() => {
    if (selectedItems.size !== 1) return;
    const item = Array.from(selectedItems.values())[0];
    if (!item) return;

    if (item.type === "folder") {
      const folder = folders.find((f) => f.id === item.id);
      if (folder) setRenameItem({ item: folder, type: "folder" });
    } else {
      const asset = assets.find((a) => a.id === item.id);
      if (asset) setRenameItem({ item: asset, type: "asset" });
    }
  }, [selectedItems, folders, assets]);

  const handleKeyboardPreview = useCallback(() => {
    if (selectedItems.size !== 1) return;
    const item = Array.from(selectedItems.values())[0];
    if (!item) return;

    if (item.type === "folder") {
      // Open folder
      handleNavigate(item.id);
    } else {
      // Preview asset
      const asset = assets.find((a) => a.id === item.id);
      if (asset) setPreviewAsset(asset);
    }
  }, [selectedItems, assets, handleNavigate]);

  // Keyboard shortcuts
  useFileBrowserShortcuts(
    {
      onNewFolder: () => setCreateFolderOpen(true),
      onUpload: () => fileInputRef.current?.click(),
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

  return (
    <div className="flex flex-col h-full overflow-clip">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />

      <AppHeader
        breadcrumbPath={allFolders.filter((f) => f.id === currentFolderId)}
        handleNavigate={handleNavigate}
        viewMode={viewMode}
        setViewMode={setViewMode}
        sortConfig={sortConfig}
        onSortChange={setSortConfig}
        onPreviewAsset={handlePreview}
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
                <p className="text-lg font-medium">Drop files or folders here to upload</p>
              </div>
            </div>
          )}

          <ScrollArea className="h-full *:data-radix-scroll-area-viewport:min-h-full">
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div
                  ref={contentContainerRef}
                  className="p-3 sm:p-6 relative min-h-[calc(100vh-8rem)]"
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
              ) : folders.length === 0 && assets.length === 0 ? (
                <EmptyState
                  icon={FolderIcon}
                  title="This folder is empty"
                  description="Create a folder or upload files to get started"
                />
              ) : viewMode === "grid" ? (
                /* Grid View - Folders first (compact), then Files */
                <DataGrid>
                  {/* Folders Section */}
                  {folders.length > 0 && (
                    <DataGridSection title="Folders">
                      <DataGridFolderContainer>
                        {folders.map((folder, index) => (
                          <DraggableFolderItem
                            key={folder.id}
                            folder={folder}
                            onOpen={handleNavigate}
                            onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                            onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                            onMove={(f) => handleMove(f, "folder")}
                            onCopy={(f) => setCopyItem({ item: f, type: "folder" })}
                            onShare={(f) => setShareItem({ item: f, type: "folder" })}
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
                        ))}
                      </DataGridFolderContainer>
                    </DataGridSection>
                  )}

                  {/* Files Section */}
                  {assets.length > 0 && (
                    <DataGridSection title="Files">
                      <DataGridFileContainer>
                        {assets.map((asset, index) => (
                          <DraggableFileItem
                            key={asset.id}
                            asset={asset}
                            onDownload={handleDownload}
                            onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                            onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                            onMove={(a) => handleMove(a, "asset")}
                            onCopy={(a) => setCopyItem({ item: a, type: "asset" })}
                            onShare={(a) => setShareItem({ item: a, type: "asset" })}
                            onStar={handleStarAsset}
                            onPreview={handlePreview}
                            viewMode={viewMode}
                            index={folders.length + index}
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
                        ))}
                      </DataGridFileContainer>
                    </DataGridSection>
                  )}
                </DataGrid>
              ) : (
                /* List View - Combined */
                <DataList>
                  <DataListHeader columns={FILE_LIST_COLUMNS} />
                  {folders.map((folder, index) => (
                    <DraggableFolderItem
                      key={folder.id}
                      folder={folder}
                      onOpen={handleNavigate}
                      onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                      onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                      onMove={(f) => handleMove(f, "folder")}
                      onCopy={(f) => setCopyItem({ item: f, type: "folder" })}
                      onShare={(f) => setShareItem({ item: f, type: "folder" })}
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
                  ))}
                  {assets.map((asset, index) => (
                    <DraggableFileItem
                      key={asset.id}
                      asset={asset}
                      onDownload={handleDownload}
                      onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                      onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                      onMove={(a) => handleMove(a, "asset")}
                      onCopy={(a) => setCopyItem({ item: a, type: "asset" })}
                      onShare={(a) => setShareItem({ item: a, type: "asset" })}
                      onStar={handleStarAsset}
                      onPreview={handlePreview}
                      viewMode={viewMode}
                      index={folders.length + index}
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
                  ))}
                </DataList>
              )}

                  {!isLoading && (folders.length > 0 || assets.length > 0) && (
                    <InfiniteScrollTrigger
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      fetchNextPage={fetchNextPage}
                    />
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-48">
                <ContextMenuItem onClick={() => setCreateFolderOpen(true)}>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New folder
                  <ContextMenuShortcut>Ctrl+N</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload files
                  <ContextMenuShortcut>Ctrl+U</ContextMenuShortcut>
                </ContextMenuItem>
                <ContextMenuSeparator />
                {allItems.length > 0 && (
                  <ContextMenuItem onClick={handleSelectAll}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Select all
                    <ContextMenuShortcut>Ctrl+A</ContextMenuShortcut>
                  </ContextMenuItem>
                )}
                <ContextMenuItem onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                  <ContextMenuShortcut>F5</ContextMenuShortcut>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
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
      <CopyDialog open={!!copyItem} onOpenChange={(open) => !open && setCopyItem(null)} item={copyItem?.item ?? null} itemType={copyItem?.type ?? "folder"} />
      <ShareDialog open={!!shareItem} onOpenChange={(open) => !open && setShareItem(null)} item={shareItem?.item ?? null} itemType={shareItem?.type ?? "folder"} />
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
        assets={assets}
        onNavigate={handlePreview}
      />

      <SelectionToolbar
        selectedItems={Array.from(selectedItems.values())}
        onClearSelection={handleClearSelection}
        onDelete={handleBulkDelete}
        onMove={handleBulkMove}
        onDownload={handleBulkDownload}
      />

      <MobileFab
        onUpload={() => fileInputRef.current?.click()}
        onNewFolder={() => setCreateFolderOpen(true)}
        disabled={uploadingCount > 0}
        hidden={selectionMode}
      />
    </div>
  );
}
