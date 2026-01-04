"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Download,
  Folder,
  Lock,
  AlertCircle,
  Loader2,
  User,
  Calendar,
  HardDrive,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileIcon as CustomFileIcon, ShareInfoPopover, ListHeader, PUBLIC_SHARE_LIST_COLUMNS } from "@/components/shared";
import { shareService } from "@/services";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
import { toast } from "sonner";
import type { SharedItemDetails, SharedFolderContents } from "@/types";
import { cn } from "@/lib/utils";
import {
  isPreviewable,
  getFileType,
  ImagePreview,
  VideoPreview,
  AudioPreview,
  TextPreview,
  UnsupportedPreview,
  LoadingPreview,
} from "@/components/preview";
import { ReadOnlyFileItem, ReadOnlyFolderItem } from "@/components/files";

// Dynamic import for PDF preview to avoid SSR issues with react-pdf
const PdfPreview = dynamic(
  () => import("@/components/preview/pdf-preview").then((m) => m.PdfPreview),
  {
    ssr: false,
    loading: () => <LoadingPreview />,
  }
);

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareDetails, setShareDetails] = useState<SharedItemDetails | null>(null);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Folder browsing state
  const [folderContents, setFolderContents] = useState<SharedFolderContents | null>(null);
  const [folderLoading, setFolderLoading] = useState(false);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [downloadingAssetId, setDownloadingAssetId] = useState<string | null>(null);
  const [downloadingFolder, setDownloadingFolder] = useState(false);

  // File preview state for folder assets
  const [previewingAsset, setPreviewingAsset] = useState<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [folderAssetPreviewUrl, setFolderAssetPreviewUrl] = useState<string | null>(null);
  const [folderAssetPreviewLoading, setFolderAssetPreviewLoading] = useState(false);

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
          shareDetails.share.requiresPassword ? password : undefined
        );
        setFolderContents(contents);
        setCurrentFolderId(folderId ?? null);
      } catch {
        toast.error("Failed to load folder contents");
      } finally {
        setFolderLoading(false);
      }
    },
    [shareDetails, token, password]
  );

  // Load folder contents when unlocked
  useEffect(() => {
    if (unlocked && shareDetails && shareDetails.item.type === "folder") {
      loadFolderContents();
    }
  }, [unlocked, shareDetails, loadFolderContents]);

  // Load preview URL when unlocked (for direct asset shares)
  const loadPreviewUrl = useCallback(async () => {
    if (!shareDetails || shareDetails.item.type !== "asset") return;
    if (!shareDetails.item.mimeType || !isPreviewable(shareDetails.item.mimeType)) return;

    setPreviewLoading(true);
    try {
      const result = await shareService.downloadSharedAsset(
        token,
        shareDetails.share.requiresPassword ? password : undefined
      );
      setPreviewUrl(result.url);
    } catch {
      // Preview failed, user can still download
    } finally {
      setPreviewLoading(false);
    }
  }, [shareDetails, token, password]);

  useEffect(() => {
    if (unlocked && shareDetails && shareDetails.item.type === "asset") {
      loadPreviewUrl();
    }
  }, [unlocked, shareDetails, loadPreviewUrl]);

  // Load preview for folder asset
  const loadFolderAssetPreview = useCallback(
    async (asset: { id: string; name: string; mimeType: string; size: number }) => {
      if (!isPreviewable(asset.mimeType)) return;

      setPreviewingAsset(asset);
      setFolderAssetPreviewLoading(true);
      setFolderAssetPreviewUrl(null);

      try {
        const result = await shareService.downloadSharedFolderAsset(
          token,
          asset.id,
          shareDetails?.share.requiresPassword ? password : undefined
        );
        setFolderAssetPreviewUrl(result.url);
      } catch {
        toast.error("Failed to load preview");
        setPreviewingAsset(null);
      } finally {
        setFolderAssetPreviewLoading(false);
      }
    },
    [token, shareDetails, password]
  );

  const handleUnlock = async () => {
    if (!password.trim()) {
      toast.error("Please enter a password");
      return;
    }

    try {
      // Try to access the share with the password
      await shareService.accessLinkShare(token, { password });
      setUnlocked(true);
      toast.success("Access granted!");
    } catch {
      toast.error("Incorrect password");
    }
  };

  const handleDownload = async () => {
    if (!shareDetails || shareDetails.item.type !== "asset") return;

    try {
      setDownloading(true);
      const result = await shareService.downloadSharedAsset(
        token,
        shareDetails.share.requiresPassword ? password : undefined
      );

      // Create download link
      const link = document.createElement("a");
      link.href = result.url;
      link.download = result.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch {
      toast.error("Failed to download file");
    } finally {
      setDownloading(false);
    }
  };

  const handleFolderAssetDownload = async (assetId: string, assetName: string) => {
    try {
      setDownloadingAssetId(assetId);
      const result = await shareService.downloadSharedFolderAsset(
        token,
        assetId,
        shareDetails?.share.requiresPassword ? password : undefined
      );

      const link = document.createElement("a");
      link.href = result.url;
      link.download = assetName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Download started");
    } catch {
      toast.error("Failed to download file");
    } finally {
      setDownloadingAssetId(null);
    }
  };

  const handleNavigateFolder = (folderId: string) => {
    loadFolderContents(folderId);
  };

  const handleBreadcrumbClick = (folderId: string, index: number) => {
    if (folderContents && index === folderContents.breadcrumbs.length - 1) {
      // Already at this folder
      return;
    }
    loadFolderContents(folderId);
  };

  const closeFolderAssetPreview = () => {
    setPreviewingAsset(null);
    setFolderAssetPreviewUrl(null);
  };

  const handleDownloadFolder = async () => {
    try {
      setDownloadingFolder(true);
      const blob = await shareService.downloadSharedFolderZip(
        token,
        currentFolderId ?? undefined,
        shareDetails?.share.requiresPassword ? password : undefined
      );

      // Create download link
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
    } catch {
      toast.error("Failed to download folder");
    } finally {
      setDownloadingFolder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading shared item...</p>
        </div>
      </div>
    );
  }

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

  // Password protected and not unlocked yet
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
              This {shareDetails.item.type === "folder" ? "folder" : "file"} is password protected.
              Enter the password to access it.
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
  const canPreview = isAsset && item.mimeType && isPreviewable(item.mimeType);
  const fileType = item.mimeType ? getFileType(item.mimeType) : "other";

  // Create asset-like object for preview components
  const previewAsset = {
    id: item.id,
    name: item.name,
    mimeType: item.mimeType || "",
    size: item.size || 0,
  };

  const renderPreview = () => {
    if (previewLoading) {
      return <LoadingPreview />;
    }

    if (!previewUrl) {
      return (
        <UnsupportedPreview
          asset={previewAsset}
          previewUrl=""
          onDownload={handleDownload}
          message="Preview not available"
        />
      );
    }

    const previewProps = {
      asset: previewAsset,
      previewUrl,
      onDownload: handleDownload,
    };

    switch (fileType) {
      case "image":
        return <ImagePreview {...previewProps} />;
      case "video":
        return <VideoPreview {...previewProps} />;
      case "audio":
        return <AudioPreview {...previewProps} />;
      case "pdf":
        return <PdfPreview {...previewProps} />;
      case "text":
      case "code":
        return <TextPreview {...previewProps} />;
      default:
        return <UnsupportedPreview {...previewProps} />;
    }
  };

  // Folder asset preview modal
  if (previewingAsset) {
    const assetFileType = getFileType(previewingAsset.mimeType);

    const renderFolderAssetPreview = () => {
      if (folderAssetPreviewLoading) {
        return <LoadingPreview />;
      }

      if (!folderAssetPreviewUrl) {
        return (
          <UnsupportedPreview
            asset={previewingAsset}
            previewUrl=""
            onDownload={() =>
              handleFolderAssetDownload(previewingAsset.id, previewingAsset.name)
            }
            message="Preview not available"
          />
        );
      }

      const previewProps = {
        asset: previewingAsset,
        previewUrl: folderAssetPreviewUrl,
        onDownload: () =>
          handleFolderAssetDownload(previewingAsset.id, previewingAsset.name),
      };

      switch (assetFileType) {
        case "image":
          return <ImagePreview {...previewProps} />;
        case "video":
          return <VideoPreview {...previewProps} />;
        case "audio":
          return <AudioPreview {...previewProps} />;
        case "pdf":
          return <PdfPreview {...previewProps} />;
        case "text":
        case "code":
          return <TextPreview {...previewProps} />;
        default:
          return <UnsupportedPreview {...previewProps} />;
      }
    };

    return (
      <div className="min-h-screen flex flex-col dark bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background/80 to-transparent absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={closeFolderAssetPreview}
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <CustomFileIcon mimeType={previewingAsset.mimeType} size="sm" />
            </div>
            <div className="min-w-0">
              <h1 className="font-medium truncate max-w-md text-foreground">
                {previewingAsset.name}
              </h1>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(previewingAsset.size)} • Shared by {share.ownerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-foreground/80 hover:text-foreground hover:bg-accent"
              onClick={() =>
                handleFolderAssetDownload(previewingAsset.id, previewingAsset.name)
              }
              disabled={downloadingAssetId === previewingAsset.id}
            >
              {downloadingAssetId === previewingAsset.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center pt-20 pb-4 px-4 min-h-0">
          {renderFolderAssetPreview()}
        </div>
      </div>
    );
  }

  // Full-screen preview for previewable assets
  if (canPreview) {
    return (
      <div className="min-h-screen flex flex-col dark bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-background/80 to-transparent absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <CustomFileIcon mimeType={item.mimeType} size="sm" />
            </div>
            <div className="min-w-0">
              <h1 className="text-foreground font-medium truncate max-w-md">{item.name}</h1>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(item.size || 0)} • Shared by {share.ownerName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShareInfoPopover
              share={{
                ownerName: share.ownerName,
                permission: share.permission,
                expiresAt: share.expiresAt,
              }}
              item={{
                name: item.name,
                type: item.type,
                size: item.size,
                mimeType: item.mimeType,
                createdAt: item.createdAt,
              }}
              variant="dark"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-foreground/80 hover:text-foreground hover:bg-accent"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Download className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Preview area */}
        <div className="flex-1 flex items-center justify-center pt-20 pb-4 px-4 min-h-0">
          {renderPreview()}
        </div>
      </div>
    );
  }

  // Folder browser UI
  if (isFolder && folderContents) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center h-14">
              {/* Left section - Breadcrumbs */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-1 text-sm overflow-x-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 shrink-0 gap-2"
                  onClick={() => loadFolderContents()}
                >
                  <Folder className="h-4 w-4 text-blue-500" />
                  <span className="hidden sm:inline">{item.name}</span>
                </Button>
                {folderContents.breadcrumbs.length > 0 && folderContents.breadcrumbs.map((crumb, index) => (
                  <div key={crumb.id} className="flex items-center shrink-0">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-8 px-2",
                        index === folderContents.breadcrumbs.length - 1 &&
                          "font-medium text-foreground"
                      )}
                      onClick={() => handleBreadcrumbClick(crumb.id, index)}
                    >
                      {crumb.name}
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right section - Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={handleDownloadFolder}
                disabled={downloadingFolder || (folderContents?.assets.length === 0 && folderContents?.folders.length === 0)}
              >
                {downloadingFolder ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
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
                    viewMode === "list" ? "bg-background shadow-sm" : "hover:bg-transparent"
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
                    viewMode === "grid" ? "bg-background shadow-sm" : "hover:bg-transparent"
                  )}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

              {/* Mobile view toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
              </Button>
            </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="py-6 px-4 sm:px-6 max-w-7xl mx-auto">
            {folderLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : folderContents.folders.length === 0 &&
              folderContents.assets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                  <Folder className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground font-medium">This folder is empty</p>
                <p className="text-sm text-muted-foreground/70 mt-1">No files or folders to display</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="space-y-8">
                {/* Folders */}
                {folderContents.folders.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Folders
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                      {folderContents.folders.map((folder) => (
                        <ReadOnlyFolderItem
                          key={folder.id}
                          folder={folder}
                          onOpen={handleNavigateFolder}
                          viewMode="grid"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Files */}
                {folderContents.assets.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Files
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {folderContents.assets.map((asset) => (
                        <ReadOnlyFileItem
                          key={asset.id}
                          asset={asset}
                          onDownload={(a) => handleFolderAssetDownload(a.id, a.name)}
                          onPreview={(a) => {
                            if (isPreviewable(a.mimeType)) {
                              loadFolderAssetPreview(a);
                            } else {
                              handleFolderAssetDownload(a.id, a.name);
                            }
                          }}
                          viewMode="grid"
                          isDownloading={downloadingAssetId === asset.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="flex flex-col">
                <ListHeader columns={PUBLIC_SHARE_LIST_COLUMNS} />
                <div className="rounded-lg border border-border/50 bg-card/30 overflow-hidden divide-y divide-border/30">
                  {/* Folders */}
                  {folderContents.folders.map((folder) => (
                    <ReadOnlyFolderItem
                      key={folder.id}
                      folder={folder}
                      onOpen={handleNavigateFolder}
                      viewMode="list"
                    />
                  ))}

                  {/* Files */}
                  {folderContents.assets.map((asset) => (
                    <ReadOnlyFileItem
                      key={asset.id}
                      asset={asset}
                      onDownload={(a) => handleFolderAssetDownload(a.id, a.name)}
                      onPreview={(a) => {
                        if (isPreviewable(a.mimeType)) {
                          loadFolderAssetPreview(a);
                        } else {
                          handleFolderAssetDownload(a.id, a.name);
                        }
                      }}
                      viewMode="list"
                      isDownloading={downloadingAssetId === asset.id}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Loading folder contents
  if (isFolder && folderLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading folder contents...</p>
        </div>
      </div>
    );
  }

  // Card layout for non-previewable files
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
          {/* Item details */}
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

          {/* Download button for assets */}
          {isAsset && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing download...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download File
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
