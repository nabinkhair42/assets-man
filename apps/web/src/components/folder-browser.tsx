"use client";

import { useState, useMemo, useRef } from "react";
import { FolderPlus, Upload, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFolderContents, useFolders, useAssets, useUploadFile } from "@/hooks";
import { FolderBreadcrumbs } from "./folder-breadcrumbs";
import { FolderItem } from "./folder-item";
import { FileItem } from "./file-item";
import { CreateFolderDialog } from "./create-folder-dialog";
import { RenameDialog } from "./rename-dialog";
import { DeleteDialog } from "./delete-dialog";
import { assetService } from "@/services";
import { toast } from "sonner";
import type { Folder, Asset } from "@/types";

interface FolderBrowserProps {
  initialFolderId?: string | null;
}

export function FolderBrowser({ initialFolderId = null }: FolderBrowserProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(initialFolderId);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameItem, setRenameItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [deleteItem, setDeleteItem] = useState<{ item: Folder | Asset; type: "folder" | "asset" } | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allFolders = [] } = useFolders();
  const { data: folders = [], isLoading: foldersLoading } = useFolderContents(currentFolderId);
  const { data: assetsData, isLoading: assetsLoading, refetch: refetchAssets } = useAssets({ folderId: currentFolderId ?? undefined });
  const uploadFile = useUploadFile();

  const assets = assetsData?.assets ?? [];
  const isLoading = foldersLoading || assetsLoading;

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!currentFolderId) return [];

    const path: Folder[] = [];
    let current = allFolders.find((f) => f.id === currentFolderId);

    while (current) {
      path.unshift(current);
      current = current.parentId ? allFolders.find((f) => f.id === current!.parentId) : undefined;
    }

    return path;
  }, [currentFolderId, allFolders]);

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

  const handleMove = () => {
    toast.info("Move functionality coming soon");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    uploadFile.mutate(
      { file, folderId: currentFolderId ?? undefined },
      {
        onSuccess: () => {
          toast.success("File uploaded successfully");
          refetchAssets();
        },
        onError: () => {
          toast.error("Failed to upload file");
        },
      }
    );

    // Reset input
    e.target.value = "";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-2">
        <FolderBreadcrumbs path={breadcrumbPath} onNavigate={handleNavigate} />
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </Button>
          <Button variant="outline" onClick={() => setCreateFolderOpen(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button onClick={handleUploadClick} disabled={uploadFile.isPending}>
            <Upload className="mr-2 h-4 w-4" />
            {uploadFile.isPending ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className={viewMode === "grid" ? "h-24" : "h-16"} />
            ))}
          </div>
        ) : folders.length === 0 && assets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <p className="text-lg">This folder is empty</p>
            <p className="text-sm">Create a folder or upload files to get started</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4" : "space-y-2"}>
            {/* Folders */}
            {folders.map((folder) => (
              <FolderItem
                key={folder.id}
                folder={folder}
                onOpen={handleNavigate}
                onRename={(f) => setRenameItem({ item: f, type: "folder" })}
                onDelete={(f) => setDeleteItem({ item: f, type: "folder" })}
                onMove={(f) => handleMove(f, "folder")}
              />
            ))}
            {/* Files */}
            {assets.map((asset) => (
              <FileItem
                key={asset.id}
                asset={asset}
                onDownload={handleDownload}
                onRename={(a) => setRenameItem({ item: a, type: "asset" })}
                onDelete={(a) => setDeleteItem({ item: a, type: "asset" })}
                onMove={(a) => handleMove(a, "asset")}
              />
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
