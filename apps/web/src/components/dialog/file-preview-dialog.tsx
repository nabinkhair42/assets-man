"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from "lucide-react";
import { cn, getApiErrorMessage } from "@/lib/utils";
import type { Asset } from "@/types";
import { assetService } from "@/services";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/formatters";
import { FileIcon } from "@/components/shared";
import { useSwipe } from "@/hooks";
import {
  getFileType,
  ImagePreview,
  VideoPreview,
  AudioPreview,
  TextPreview,
  UnsupportedPreview,
  LoadingPreview,
} from "@/components/preview";

// Dynamic import for PDF preview to avoid SSR issues with react-pdf
const PdfPreview = dynamic(
  () => import("@/components/preview/pdf-preview").then((m) => m.PdfPreview),
  {
    ssr: false,
    loading: () => <LoadingPreview />,
  }
);

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  assets?: Asset[];
  onNavigate?: (asset: Asset) => void;
  getDownloadUrl?: (assetId: string) => Promise<{ url: string }>;
  // Additional customization for public share pages
  subtitle?: string;
  onDownload?: () => void;
  showNavigation?: boolean;
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  asset,
  assets = [],
  onNavigate,
  getDownloadUrl: customGetDownloadUrl,
  subtitle,
  onDownload: customOnDownload,
  showNavigation = true,
}: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PDF-specific state
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfPageNumber, setPdfPageNumber] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.0);
  const [pdfRotation, setPdfRotation] = useState(0);


  const currentIndex = asset ? assets.findIndex((a) => a.id === asset.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < assets.length - 1;

  const fileType = asset ? getFileType(asset.mimeType, asset.name) : "other";
  const isPdf = fileType === "pdf";

  const loadPreview = useCallback(async (assetToLoad: Asset) => {
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    // Reset PDF state
    setPdfNumPages(0);
    setPdfPageNumber(1);
    setPdfScale(1.0);
    setPdfRotation(0);

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

    // Use custom download handler if provided
    if (customOnDownload) {
      customOnDownload();
      return;
    }

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
    } catch (error) {
      toast.error(getApiErrorMessage(error));
    }
  }, [asset, customGetDownloadUrl, customOnDownload]);

  // PDF controls
  const handlePdfPrevPage = () => setPdfPageNumber((prev) => Math.max(prev - 1, 1));
  const handlePdfNextPage = () => setPdfPageNumber((prev) => Math.min(prev + 1, pdfNumPages));
  const handleZoomIn = () => setPdfScale((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setPdfScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setPdfRotation((prev) => (prev + 90) % 360);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (isPdf && pdfPageNumber > 1) {
          handlePdfPrevPage();
        } else {
          handlePrev();
        }
      } else if (e.key === "ArrowRight") {
        if (isPdf && pdfPageNumber < pdfNumPages) {
          handlePdfNextPage();
        } else {
          handleNext();
        }
      } else if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "+" || e.key === "=") {
        if (isPdf) handleZoomIn();
      } else if (e.key === "-") {
        if (isPdf) handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange, isPdf, pdfPageNumber, pdfNumPages]);

  // Swipe gesture handlers for mobile navigation
  const swipeHandlers = useMemo(() => ({
    onSwipeLeft: hasNext ? handleNext : undefined,
    onSwipeRight: hasPrev ? handlePrev : undefined,
  }), [hasNext, hasPrev, handleNext, handlePrev]);

  const touchHandlers = useSwipe(swipeHandlers, {
    threshold: 50,
    maxTime: 300,
  });

  if (!asset) return null;

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
        return (
          <PdfPreview
            {...previewProps}
            pageNumber={pdfPageNumber}
            scale={pdfScale}
            rotation={pdfRotation}
            onLoadSuccess={setPdfNumPages}
            minimal
          />
        );
      case "text":
      case "code":
        return (
          <TextPreview
            {...previewProps}
            minimal
          />
        );
      case "document":
        const encodedUrl = encodeURIComponent(previewUrl);
        return (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <iframe
              src={`https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`}
              className="w-full h-full border-0 rounded-lg bg-white"
              style={{ maxWidth: "900px", maxHeight: "calc(100vh - 120px)" }}
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
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/90 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col outline-none bg-black/95">
          {/* Header */}
          <header className="flex items-center justify-between h-12 sm:h-14 px-2 sm:px-4 bg-black/50 backdrop-blur-sm border-b border-white/10">
            {/* Left: File info */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <FileIcon mimeType={asset.mimeType} size="sm" className="shrink-0" />
              <div className="min-w-0">
                <DialogPrimitive.Title className="text-white font-medium truncate text-xs sm:text-sm max-w-[120px] sm:max-w-none">
                  {asset.name}
                </DialogPrimitive.Title>
                <p className="text-white/60 text-[10px] sm:text-xs">
                  {formatFileSize(asset.size)}
                  {showNavigation && assets.length > 1 && ` • ${currentIndex + 1} of ${assets.length}`}
                  {subtitle && ` • ${subtitle}`}
                </p>
              </div>
            </div>

            {/* Center: File-type specific controls */}
            <div className="flex items-center gap-1">
              {/* PDF Controls */}
              {isPdf && pdfNumPages > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={handlePdfPrevPage}
                    disabled={pdfPageNumber <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-white/80 text-sm min-w-[60px] text-center tabular-nums">
                    {pdfPageNumber} / {pdfNumPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                    onClick={handlePdfNextPage}
                    disabled={pdfPageNumber >= pdfNumPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <div className="w-px h-5 bg-white/20 mx-2 hidden sm:block" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex"
                    onClick={handleZoomOut}
                    disabled={pdfScale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-white/60 text-xs min-w-[40px] text-center hidden sm:block">
                    {Math.round(pdfScale * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex"
                    onClick={handleZoomIn}
                    disabled={pdfScale >= 3.0}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 hidden sm:flex"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}

            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 text-white/70 hover:text-white hover:bg-white/10"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </header>

          {/* Main preview area with swipe gesture support */}
          <div
            className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden"
            {...touchHandlers}
          >
            {renderPreview()}
          </div>

          {/* Mobile PDF controls toolbar */}
          {isPdf && pdfNumPages > 0 && (
            <div className="sm:hidden flex items-center justify-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-sm border-t border-white/10">
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleZoomOut}
                disabled={pdfScale <= 0.5}
              >
                <ZoomOut className="h-4 w-4 mr-1" />
                Out
              </Button>
              <span className="text-white/60 text-xs">{Math.round(pdfScale * 100)}%</span>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleZoomIn}
                disabled={pdfScale >= 3.0}
              >
                <ZoomIn className="h-4 w-4 mr-1" />
                In
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
                onClick={handleRotate}
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Navigation arrows for multiple files */}
          {showNavigation && assets.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                disabled={!hasPrev}
                className={cn(
                  "absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10",
                  "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center",
                  "bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                  "text-white transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/30",
                  !hasPrev && "opacity-30 cursor-not-allowed hover:bg-black/50"
                )}
              >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
              <button
                onClick={handleNext}
                disabled={!hasNext}
                className={cn(
                  "absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10",
                  "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center",
                  "bg-black/50 hover:bg-black/70 backdrop-blur-sm",
                  "text-white transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-white/30",
                  !hasNext && "opacity-30 cursor-not-allowed hover:bg-black/50"
                )}
              >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
