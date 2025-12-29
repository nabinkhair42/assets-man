"use client";

import { useEffect, useState, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";
import { assetService } from "@/services";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/formatters";
import {
  getFileType,
  ImagePreview,
  VideoPreview,
  AudioPreview,
  PdfPreview,
  TextPreview,
  UnsupportedPreview,
  LoadingPreview,
} from "@/components/preview";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  assets?: Asset[];
  onNavigate?: (asset: Asset) => void;
  // Custom function to get download URL (for shared assets)
  getDownloadUrl?: (assetId: string) => Promise<{ url: string }>;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  asset,
  assets = [],
  onNavigate,
  getDownloadUrl: customGetDownloadUrl,
}: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentIndex = asset ? assets.findIndex((a) => a.id === asset.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < assets.length - 1;

  const loadPreview = useCallback(async (assetToLoad: Asset) => {
    setLoading(true);
    setError(null);
    setPreviewUrl(null);

    try {
      const fetchUrl = customGetDownloadUrl || assetService.getDownloadUrl;
      const { url } = await fetchUrl(assetToLoad.id);
      setPreviewUrl(url);
    } catch {
      setError("Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, [customGetDownloadUrl]);

  useEffect(() => {
    if (open && asset) {
      loadPreview(asset);
    } else {
      setPreviewUrl(null);
      setError(null);
    }
  }, [open, asset, loadPreview]);

  const handlePrev = useCallback(() => {
    if (hasPrev && assets[currentIndex - 1]) {
      onNavigate?.(assets[currentIndex - 1]);
    }
  }, [hasPrev, assets, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext && assets[currentIndex + 1]) {
      onNavigate?.(assets[currentIndex + 1]);
    }
  }, [hasNext, assets, currentIndex, onNavigate]);

  const handleDownload = useCallback(async () => {
    if (!asset) return;
    try {
      const fetchUrl = customGetDownloadUrl || assetService.getDownloadUrl;
      const { url } = await fetchUrl(asset.id);
      const link = document.createElement("a");
      link.href = url;
      link.download = asset.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Download started");
    } catch {
      toast.error("Failed to download file");
    }
  }, [asset, customGetDownloadUrl]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange]);

  if (!asset) return null;

  const fileType = getFileType(asset.mimeType);

  const renderPreview = () => {
    if (loading) {
      return <LoadingPreview />;
    }

    if (error || !previewUrl) {
      return (
        <UnsupportedPreview
          asset={asset}
          previewUrl=""
          onDownload={handleDownload}
          message={error || "Preview not available"}
        />
      );
    }

    const previewProps = {
      asset,
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
      case "document":
        // For Office documents, try Google Docs viewer
        const encodedUrl = encodeURIComponent(previewUrl);
        return (
          <div className="flex flex-col items-center justify-center w-full h-full p-4">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`}
              className="w-full h-full border-0 rounded-lg bg-white"
              style={{ maxWidth: "900px", maxHeight: "calc(100vh - 140px)" }}
              title={asset.name}
            />
          </div>
        );
      default:
        return <UnsupportedPreview {...previewProps} />;
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Full-screen dark overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col outline-none">
          {/* Header - Floating style */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-4 min-w-0">
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogPrimitive.Close>
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-white font-medium truncate max-w-md">
                  {asset.name}
                </DialogPrimitive.Title>
                <p className="text-white/50 text-xs">
                  {formatFileSize(asset.size)}
                  {assets.length > 1 && ` • ${currentIndex + 1} of ${assets.length}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleDownload}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Main preview area */}
          <div className="flex-1 flex items-center justify-center px-4 pt-20 pb-4 min-h-0">
            {renderPreview()}
          </div>

          {/* Navigation arrows */}
          {assets.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 z-10",
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
                  "text-white transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/30",
                  !hasPrev && "opacity-30 cursor-not-allowed hover:bg-white/10"
                )}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className={cn(
                  "absolute right-4 top-1/2 -translate-y-1/2 z-10",
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  "bg-white/10 hover:bg-white/20 backdrop-blur-sm",
                  "text-white transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/30",
                  !hasNext && "opacity-30 cursor-not-allowed hover:bg-white/10"
                )}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
