"use client";

import { FilePreviewDialog } from "@/components/dialog/file-preview-dialog";
import {
  ReadOnlyFileItem,
  type ReadOnlyAsset,
} from "@/components/files/readonly-file-item";
import {
  ReadOnlyFolderItem,
  type ReadOnlyFolder,
} from "@/components/files/readonly-folder-item";
import { isPreviewable } from "@/components/preview";
import { FileIcon as CustomFileIcon } from "@/components/shared/file-icon";
import { FILE_LIST_COLUMNS } from "@/components/shared/list-columns";
import {
  SelectionToolbar,
  type SelectedItem,
} from "@/components/shared/selection-toolbar";
import { ShareInfoPopover } from "@/components/shared/share-info-popover";
import { FileBrowserSkeleton } from "@/components/loaders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DataGrid,
  DataGridFileContainer,
  DataGridFolderContainer,
  DataGridSection,
  DataList,
  DataListEmpty,
  DataListHeader,
} from "@/components/ui/data-list";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useViewMode } from "@/hooks/use-view-mode";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { shareService } from "@/services/share-service";
import type { Asset } from "@/types/asset";
import type { SharedFolderContents, SharedItemDetails } from "@/types/share";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  Download,
  Folder,
  HardDrive,
  LayoutGrid,
  List,
  Loader,
  Lock,
  User,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ShareProvider } from "@/contexts/share-context";

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDetails, setShareDetails] = useState<SharedItemDetails | null>(
    null,
  );
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Folder browsing state
  const [folderContents, setFolderContents] =
    useState<SharedFolderContents | null>(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const { viewMode, setViewMode } = useViewMode();
  const [downloadingAssetId, setDownloadingAssetId] = useState<string | null>(
    null,
  );
  const [downloadingFolder, setDownloadingFolder] = useState(false);

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(
    new Map(),
  );
  const lastSelectedIndex = useRef<number | null>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const selectionMode = selectedItems.size > 0;

  // File preview state for folder assets (uses FilePreviewDialog)
  const [previewingAsset, setPreviewingAsset] = useState<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);

  // Direct asset preview dialog state
  const [directAssetPreviewOpen, setDirectAssetPreviewOpen] = useState(false);

  useEffect(() => {
    async function fetchDetails() {
      try {
        setLoading(true);
        const details = await shareService.getLinkShareDetails(token);
        setShareDetails(details);

        // If no password required, mark as unlocked
        if (!details.share.requiresPassword) {
          setUnlocked(true);
        }
      } catch (err) {
        setError("This share link is invalid or has expired.");
        console.warn("Error fetching share details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchDetails();
    }
  }, [token]);

  // Load folder contents when unlocked and share is a folder
  const loadFolderContents = useCallback(
    async (folderId?: string) => {
      if (!shareDetails || shareDetails.item.type !== "folder") return;

      setFolderLoading(true);
      try {
        const contents = await shareService.getSharedFolderContents(
          token,
          folderId,
          shareDetails.share.requiresPassword ? password : undefined,
        );
        setFolderContents(contents);
        setCurrentFolderId(folderId ?? null);
      } catch (error) {
        toast.error(getApiErrorMessage(error));
      } finally {
        setFolderLoading(false);
      }
    },
    [shareDetails, token, password],
  );

  // Load folder contents when unlocked
  useEffect(() => {
    if (unlocked && shareDetails && shareDetails.item.type === "folder") {
      loadFolderContents();
    }
  }, [unlocked, shareDetails, loadFolderContents]);

  // Open preview dialog when unlocked for direct asset shares
  useEffect(() => {
    if (unlocked && shareDetails && shareDetails.item.type === "asset") {
      if (
        isPreviewable(shareDetails.item.mimeType || "", shareDetails.item.name)
      ) {
        setDirectAssetPreviewOpen(true);
      }
    }
  }, [unlocked, shareDetails]);

  // Open preview dialog for folder asset
  const openFolderAssetPreview = useCallback(
    (asset: { id: string; name: string; mimeType: string; size: number }) => {
      if (!isPreviewable(asset.mimeType, asset.name)) return;
      setPreviewingAsset(asset);
    },
    [],
  );

  // Get download URL for folder asset (used by FilePreviewDialog)
  const getFolderAssetDownloadUrl = useCallback(
    async (assetId: string) => {
      const result = await shareService.downloadSharedFolderAsset(
        token,
        assetId,
        shareDetails?.share.requiresPassword ? password : undefined,
      );
      return { url: result.url };
    },
    [token, shareDetails, password],
  );

  // Get download URL for direct asset share (used by FilePreviewDialog)
  const getDirectAssetDownloadUrl = useCallback(async () => {
    const result = await shareService.downloadSharedAsset(
      token,
      shareDetails?.share.requiresPassword ? password : undefined,
    );
    return { url: result.url };
  }, [token, shareDetails, password]);

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    try {
      await shareService.accessLinkShare(token, { password });
      setUnlocked(true);
      toast.success("Access granted!");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Incorrect password"));
    }
  };

  const handleDownload = async () => {
    if (!shareDetails || shareDetails.item.type !== "asset") return;

    try {
      setDownloading(true);
      const result = await shareService.downloadSharedAsset(
        token,
        shareDetails.share.requiresPassword ? password : undefined,
      );

      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  const handleFolderAssetDownload = async (
    assetId: string,
    assetName: string,
  ) => {
    try {
      setDownloadingAssetId(assetId);
      const result = await shareService.downloadSharedFolderAsset(
        token,
        assetId,
        shareDetails?.share.requiresPassword ? password : undefined,
      );

      const link = document.createElement("a");
      link.href = result.url;
      link.download = assetName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingAssetId(null);
    }
  };

  const handleNavigateFolder = (folderId: string) => {
    loadFolderContents(folderId);
  };

  const handleBreadcrumbClick = (folderId: string, index: number) => {
    if (folderContents && index === folderContents.breadcrumbs.length - 1) {
      return;
    }
    loadFolderContents(folderId);
  };

  const closeFolderAssetPreview = () => {
    setPreviewingAsset(null);
  };

  const handleDownloadFolder = async () => {
    try {
      setDownloadingFolder(true);
      const blob = await shareService.downloadSharedFolderZip(
        token,
        currentFolderId ?? undefined,
        shareDetails?.share.requiresPassword ? password : undefined,
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const folderName = folderContents?.currentFolder.name ?? "folder";
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Download started");
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setDownloadingFolder(false);
    }
  };

  // Combined list of all items for selection operations
  const allItems = useMemo(() => {
    if (!folderContents) return [];
    const items: Array<{ id: string; type: "folder" | "asset"; name: string }> =
      [];
    folderContents.folders.forEach((folder) =>
      items.push({ id: folder.id, type: "folder", name: folder.name }),
    );
    folderContents.assets.forEach((asset) =>
      items.push({ id: asset.id, type: "asset", name: asset.name }),
    );
    return items;
  }, [folderContents]);

  // Selection handlers
  const handleItemSelect = useCallback(
    (
      index: number,
      id: string,
      type: "folder" | "asset",
      name: string,
      selected: boolean,
      shiftKey: boolean,
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
              next.set(`${item.type}-${item.id}`, {
                id: item.id,
                type: item.type,
                name: item.name,
              });
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
    },
    [allItems],
  );

  const handleSelectFolder = useCallback(
    (folder: ReadOnlyFolder, selected: boolean, shiftKey = false) => {
      const index = allItems.findIndex(
        (item) => item.type === "folder" && item.id === folder.id,
      );
      handleItemSelect(
        index,
        folder.id,
        "folder",
        folder.name,
        selected,
        shiftKey,
      );
    },
    [allItems, handleItemSelect],
  );

  const handleSelectAsset = useCallback(
    (asset: ReadOnlyAsset, selected: boolean, shiftKey = false) => {
      const index = allItems.findIndex(
        (item) => item.type === "asset" && item.id === asset.id,
      );
      handleItemSelect(
        index,
        asset.id,
        "asset",
        asset.name,
        selected,
        shiftKey,
      );
    },
    [allItems, handleItemSelect],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Map());
    lastSelectedIndex.current = null;
  }, []);

  // Clear selection when navigating folders
  useEffect(() => {
    handleClearSelection();
  }, [currentFolderId, handleClearSelection]);

  const pendingSelection = new Set<string>();

  // Bulk download selected items
  const handleBulkDownload = useCallback(async () => {
    const items = Array.from(selectedItems.values());
    const assets = items.filter((item) => item.type === "asset");

    if (assets.length === 0) {
      toast.info("Please select files to download");
      return;
    }

    const toastId = toast.loading(`Downloading ${assets.length} file(s)`);
    let successCount = 0;

    for (const item of assets) {
      try {
        const result = await shareService.downloadSharedFolderAsset(
          token,
          item.id,
          shareDetails?.share.requiresPassword ? password : undefined,
        );

        const link = document.createElement("a");
        link.href = result.url;
        link.download = result.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        successCount++;
      } catch {
        // Continue with next file
      }
    }

    if (successCount === assets.length) {
      toast.success(`Downloaded ${successCount} file(s)`, { id: toastId });
    } else if (successCount > 0) {
      toast.warning(`Downloaded ${successCount} of ${assets.length} file(s)`, {
        id: toastId,
      });
    } else {
      toast.error("Failed to download files", { id: toastId });
    }
    handleClearSelection();
  }, [selectedItems, token, shareDetails, password, handleClearSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!folderContents) return;

      if (e.key === "Escape") {
        handleClearSelection();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        const newSelection = new Map<string, SelectedItem>();
        for (const item of allItems) {
          newSelection.set(`${item.type}-${item.id}`, {
            id: item.id,
            type: item.type,
            name: item.name,
          });
        }
        setSelectedItems(newSelection);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedItems.size > 0) {
        e.preventDefault();
        handleBulkDownload();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    folderContents,
    allItems,
    selectedItems,
    handleClearSelection,
    handleBulkDownload,
  ]);

  // --- Initial loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // --- Error ---
  if (error || !shareDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Share Not Found</CardTitle>
            <CardDescription>
              {error || "This share link is invalid or has expired."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // --- Password gate ---
  if (shareDetails.share.requiresPassword && !unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>
              This {shareDetails.item.type === "folder" ? "folder" : "file"} is
              password protected. Enter the password to access it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            <Button className="w-full" onClick={handleUnlock}>
              Unlock
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { item, share } = shareDetails;
  const isAsset = item.type === "asset";
  const isFolder = item.type === "folder";
  const canPreview =
    isAsset && item.mimeType && isPreviewable(item.mimeType, item.name);

  const previewAsset = {
    id: item.id,
    name: item.name,
    mimeType: item.mimeType || "",
    size: item.size || 0,
  };

  // --- Direct asset preview ---
  if (canPreview && directAssetPreviewOpen) {
    return (
      <FilePreviewDialog
        open={directAssetPreviewOpen}
        onOpenChange={setDirectAssetPreviewOpen}
        asset={previewAsset as Asset}
        getDownloadUrl={getDirectAssetDownloadUrl}
        onDownload={handleDownload}
        subtitle={`Shared by ${share.ownerName}`}
        showNavigation={false}
      />
    );
  }

  // --- Folder browser ---
  if (isFolder) {
    return (
      <ShareProvider token={token}>
        <div className="min-h-screen flex flex-col bg-background">
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-center h-14">
                {/* Left section - Breadcrumbs */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {folderLoading && !folderContents ? (
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-sm overflow-x-auto">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "h-8 px-2 shrink-0 gap-2",
                          !currentFolderId && "font-medium text-foreground",
                        )}
                        onClick={() => loadFolderContents()}
                      >
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span className="hidden sm:inline">{item.name}</span>
                      </Button>
                      {folderContents?.breadcrumbs
                        .filter((crumb) => crumb.id !== item.id)
                        .map((crumb, index, filteredBreadcrumbs) => (
                          <div
                            key={crumb.id}
                            className="flex items-center shrink-0"
                          >
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <Button
                              variant="ghost"
                              size="sm"
                              className={cn(
                                "h-8 px-2",
                                index === filteredBreadcrumbs.length - 1 &&
                                  "font-medium text-foreground",
                              )}
                              onClick={() =>
                                handleBreadcrumbClick(crumb.id, index)
                              }
                            >
                              {crumb.name}
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={handleDownloadFolder}
                    disabled={
                      downloadingFolder ||
                      folderLoading ||
                      (!folderContents?.assets.length &&
                        !folderContents?.folders.length)
                    }
                  >
                    {downloadingFolder ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>

                  <ShareInfoPopover
                    share={{
                      ownerName: share.ownerName,
                      permission: share.permission,
                      expiresAt: share.expiresAt,
                    }}
                    item={{
                      name: item.name,
                      type: item.type,
                      createdAt: item.createdAt,
                    }}
                  />

                  {/* View mode toggle */}
                  <div className="hidden sm:flex items-center ml-1 p-0.5 rounded-lg bg-muted/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("list")}
                      className={cn(
                        "h-7 w-7 rounded-md",
                        viewMode === "list"
                          ? "bg-background shadow-sm"
                          : "hover:bg-transparent",
                      )}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setViewMode("grid")}
                      className={cn(
                        "h-7 w-7 rounded-md",
                        viewMode === "grid"
                          ? "bg-background shadow-sm"
                          : "hover:bg-transparent",
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Mobile view toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setViewMode(viewMode === "grid" ? "list" : "grid")
                    }
                    className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    {viewMode === "grid" ? (
                      <List className="h-4 w-4" />
                    ) : (
                      <LayoutGrid className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <ScrollArea className="flex-1">
            <div
              ref={contentContainerRef}
              className="py-6 px-4 sm:px-6 max-w-7xl mx-auto relative"
            >
              {folderLoading ? (
                <FileBrowserSkeleton viewMode={viewMode} count={6} />
              ) : !folderContents ||
                (folderContents.folders.length === 0 &&
                  folderContents.assets.length === 0) ? (
                <DataListEmpty
                  icon={Folder}
                  title="This folder is empty"
                  description="No files or folders to display"
                />
              ) : viewMode === "grid" ? (
                <DataGrid>
                  {folderContents.folders.length > 0 && (
                    <DataGridSection title="Folders">
                      <DataGridFolderContainer>
                        {folderContents.folders.map((folder) => (
                          <ReadOnlyFolderItem
                            key={folder.id}
                            folder={folder}
                            onOpen={handleNavigateFolder}
                            viewMode="grid"
                            isSelected={selectedItems.has(
                              `folder-${folder.id}`,
                            )}
                            isPendingSelection={pendingSelection.has(
                              `folder-${folder.id}`,
                            )}
                            onSelect={handleSelectFolder}
                          />
                        ))}
                      </DataGridFolderContainer>
                    </DataGridSection>
                  )}
                  {folderContents.assets.length > 0 && (
                    <DataGridSection title="Files">
                      <DataGridFileContainer>
                        {folderContents.assets.map((asset) => (
                          <ReadOnlyFileItem
                            key={asset.id}
                            asset={asset}
                            onDownload={(a) =>
                              handleFolderAssetDownload(a.id, a.name)
                            }
                            onPreview={(a) => {
                              if (isPreviewable(a.mimeType, a.name)) {
                                openFolderAssetPreview(a);
                              } else {
                                handleFolderAssetDownload(a.id, a.name);
                              }
                            }}
                            viewMode="grid"
                            isDownloading={downloadingAssetId === asset.id}
                            isSelected={selectedItems.has(`asset-${asset.id}`)}
                            isPendingSelection={pendingSelection.has(
                              `asset-${asset.id}`,
                            )}
                            onSelect={handleSelectAsset}
                          />
                        ))}
                      </DataGridFileContainer>
                    </DataGridSection>
                  )}
                </DataGrid>
              ) : (
                <DataList>
                  <DataListHeader columns={FILE_LIST_COLUMNS} />
                  {folderContents.folders.map((folder) => (
                    <ReadOnlyFolderItem
                      key={folder.id}
                      folder={folder}
                      onOpen={handleNavigateFolder}
                      viewMode="list"
                      isSelected={selectedItems.has(`folder-${folder.id}`)}
                      isPendingSelection={pendingSelection.has(
                        `folder-${folder.id}`,
                      )}
                      onSelect={handleSelectFolder}
                    />
                  ))}
                  {folderContents.assets.map((asset) => (
                    <ReadOnlyFileItem
                      key={asset.id}
                      asset={asset}
                      onDownload={(a) =>
                        handleFolderAssetDownload(a.id, a.name)
                      }
                      onPreview={(a) => {
                        if (isPreviewable(a.mimeType, a.name)) {
                          openFolderAssetPreview(a);
                        } else {
                          handleFolderAssetDownload(a.id, a.name);
                        }
                      }}
                      viewMode="list"
                      isDownloading={downloadingAssetId === asset.id}
                      isSelected={selectedItems.has(`asset-${asset.id}`)}
                      isPendingSelection={pendingSelection.has(
                        `asset-${asset.id}`,
                      )}
                      onSelect={handleSelectAsset}
                    />
                  ))}
                </DataList>
              )}
            </div>
          </ScrollArea>

          {/* Selection Toolbar */}
          {selectionMode && (
            <SelectionToolbar
              selectedItems={selectedItems}
              onClearSelection={handleClearSelection}
              onBulkDownload={handleBulkDownload}
              variant="readonly"
            />
          )}

          {/* Folder Asset Preview Dialog */}
          <FilePreviewDialog
            open={!!previewingAsset}
            onOpenChange={(open) => !open && closeFolderAssetPreview()}
            asset={previewingAsset as Asset}
            getDownloadUrl={getFolderAssetDownloadUrl}
            onDownload={() =>
              previewingAsset &&
              handleFolderAssetDownload(
                previewingAsset.id,
                previewingAsset.name,
              )
            }
            subtitle={`Shared by ${share.ownerName}`}
            showNavigation={false}
          />
        </div>
      </ShareProvider>
    );
  }

  // --- Asset card (non-previewable files) ---
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4">
            {isAsset ? (
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <CustomFileIcon mimeType={item.mimeType} size="lg" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Folder className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-xl break-all">{item.name}</CardTitle>
          <CardDescription>Shared by {share.ownerName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Shared by:</span>
              <span className="font-medium">{share.ownerName}</span>
            </div>
            {isAsset && item.size && (
              <div className="flex items-center gap-3 text-sm">
                <HardDrive className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Size:</span>
                <span className="font-medium">{formatFileSize(item.size)}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">
                {formatRelativeTime(new Date(item.createdAt))}
              </span>
            </div>
            {share.expiresAt && (
              <div className="flex items-center gap-3 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-muted-foreground">Expires:</span>
                <span className="font-medium text-amber-600">
                  {formatRelativeTime(new Date(share.expiresAt))}
                </span>
              </div>
            )}
          </div>

          {isAsset && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleDownload}
              disabled={downloading}
              isLoading={downloading}
              loadingText="Preparing download..."
            >
              <Download className="mr-2 h-4 w-4" />
              Download File
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
