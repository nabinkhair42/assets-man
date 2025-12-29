"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Download, Folder, Lock, AlertCircle, Loader2, User, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon as CustomFileIcon, ShareInfoPopover } from "@/components/shared";
import { shareService } from "@/services";
import { formatFileSize, formatRelativeTime } from "@/lib/formatters";
import { toast } from "sonner";
import type { SharedItemDetails } from "@/types";
import {
  isPreviewable,
  getFileType,
  ImagePreview,
  VideoPreview,
  AudioPreview,
  PdfPreview,
  TextPreview,
  UnsupportedPreview,
  LoadingPreview,
} from "@/components/preview";

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
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchDetails();
    }
  }, [token]);

  // Load preview URL when unlocked
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
    if (unlocked && shareDetails) {
      loadPreviewUrl();
    }
  }, [unlocked, shareDetails, loadPreviewUrl]);

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
              This file is password protected. Enter the password to access it.
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

  // Full-screen preview for previewable assets
  if (canPreview) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center gap-4 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
              <CustomFileIcon mimeType={item.mimeType} size="sm" />
            </div>
            <div className="min-w-0">
              <h1 className="text-muted-foreground font-medium truncate max-w-md">{item.name}</h1>
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
              className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10"
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

  // Card layout for non-previewable files or folders
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
          <CardDescription>
            Shared by {share.ownerName}
          </CardDescription>
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
              <span className="font-medium">{formatRelativeTime(new Date(item.createdAt))}</span>
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

          {/* Folder message */}
          {!isAsset && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Folder sharing is view-only. Contact the owner for access.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
