"use client";

import { useEffect, useState, useCallback } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Download, X, ChevronLeft, ChevronRight, Loader2, FileText, FileImage, Film, Music, ZoomIn, ZoomOut, RotateCw, FileCode, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Asset } from "@/types";
import { assetService } from "@/services";
import { toast } from "sonner";
import { formatFileSize } from "@/lib/formatters";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  assets?: Asset[];
  onNavigate?: (asset: Asset) => void;
}

function getFileType(mimeType: string): "image" | "video" | "audio" | "pdf" | "document" | "text" | "code" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "document";
  }
  // JSON files
  if (mimeType === "application/json") return "code";
  // CSV files
  if (mimeType === "text/csv" || mimeType === "application/csv") return "text";
  // Text and code files
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/javascript" ||
    mimeType === "application/typescript" ||
    mimeType === "application/xml" ||
    mimeType === "application/x-yaml" ||
    mimeType === "application/x-sh"
  ) {
    return "text";
  }
  return "other";
}

function FileTypeIcon({ mimeType, size = "lg" }: { mimeType: string; size?: "md" | "lg" }) {
  const fileType = getFileType(mimeType);
  const sizeClass = size === "lg" ? "h-24 w-24" : "h-12 w-12";

  switch (fileType) {
    case "image":
      return <FileImage className={cn(sizeClass, "text-blue-400")} />;
    case "video":
      return <Film className={cn(sizeClass, "text-purple-400")} />;
    case "audio":
      return <Music className={cn(sizeClass, "text-green-400")} />;
    case "code":
      return <FileCode className={cn(sizeClass, "text-yellow-400")} />;
    case "text":
      return mimeType.includes("csv")
        ? <FileSpreadsheet className={cn(sizeClass, "text-emerald-400")} />
        : <FileText className={cn(sizeClass, "text-orange-400")} />;
    default:
      return <FileText className={cn(sizeClass, "text-gray-400")} />;
  }
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  asset,
  assets = [],
  onNavigate,
}: FilePreviewDialogProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);

  const currentIndex = asset ? assets.findIndex((a) => a.id === asset.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < assets.length - 1;

  const loadPreview = useCallback(async (assetToLoad: Asset) => {
    setLoading(true);
    setError(null);
    setPreviewUrl(null);
    setTextContent(null);
    setImageZoom(1);
    setImageRotation(0);

    try {
      const { url } = await assetService.getDownloadUrl(assetToLoad.id);
      setPreviewUrl(url);

      // For text/code files, fetch the content
      const fileType = getFileType(assetToLoad.mimeType);
      if (fileType === "text" || fileType === "code") {
        try {
          const response = await fetch(url);
          const text = await response.text();
          // Limit text content to prevent performance issues
          setTextContent(text.slice(0, 500000));
        } catch {
          // If text fetch fails, we can still show download option
        }
      }
    } catch {
      setError("Failed to load preview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && asset) {
      loadPreview(asset);
    } else {
      setPreviewUrl(null);
      setTextContent(null);
      setError(null);
      setImageZoom(1);
      setImageRotation(0);
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

  const handleDownload = async () => {
    if (!asset) return;
    try {
      const { url } = await assetService.getDownloadUrl(asset.id);
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
  };

  const handleZoomIn = () => setImageZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setImageZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setImageRotation((prev) => (prev + 90) % 360);

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
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handlePrev, handleNext, onOpenChange]);

  if (!asset) return null;

  const fileType = getFileType(asset.mimeType);

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-white/10" />
            <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          </div>
          <p className="text-white/60 text-sm">Loading preview...</p>
        </div>
      );
    }

    if (error || !previewUrl) {
      return (
        <div className="flex flex-col items-center justify-center gap-6">
          <div className="p-8 rounded-2xl bg-white/5">
            <FileTypeIcon mimeType={asset.mimeType} />
          </div>
          <div className="text-center">
            <p className="text-white/80 font-medium mb-1">{asset.name}</p>
            <p className="text-white/40 text-sm mb-4">{error || "Preview not available"}</p>
          </div>
          <Button onClick={handleDownload} className="bg-white text-black hover:bg-white/90">
            <Download className="mr-2 h-4 w-4" />
            Download to view
          </Button>
        </div>
      );
    }

    switch (fileType) {
      case "image":
        return (
          <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
            <img
              src={previewUrl}
              alt={asset.name}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        );
      case "video":
        return (
          <video
            src={previewUrl}
            controls
            autoPlay
            className="max-h-full max-w-full rounded-lg shadow-2xl"
            style={{ maxHeight: "calc(100vh - 200px)" }}
          >
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return (
          <div className="flex flex-col items-center gap-8 p-8">
            <div className="p-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
              <Music className="h-20 w-20 text-green-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium text-lg mb-1">{asset.name}</p>
              <p className="text-white/50 text-sm">{formatFileSize(asset.size)}</p>
            </div>
            <audio src={previewUrl} controls autoPlay className="w-full max-w-lg">
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      case "pdf":
        return (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0 rounded-lg"
            style={{ maxWidth: "900px", maxHeight: "calc(100vh - 140px)" }}
            title={asset.name}
          />
        );
      case "document":
        const encodedUrl = encodeURIComponent(previewUrl);
        const viewerUrl = `https://docs.google.com/viewer?url=${encodedUrl}&embedded=true`;
        return (
          <iframe
            src={viewerUrl}
            className="w-full h-full border-0 rounded-lg bg-white"
            style={{ maxWidth: "900px", maxHeight: "calc(100vh - 140px)" }}
            title={asset.name}
          />
        );
      case "text":
      case "code":
        if (!textContent) {
          return (
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="p-8 rounded-2xl bg-white/5">
                <FileTypeIcon mimeType={asset.mimeType} />
              </div>
              <div className="text-center">
                <p className="text-white/80 font-medium mb-1">{asset.name}</p>
                <p className="text-white/40 text-sm mb-4">Loading content...</p>
              </div>
            </div>
          );
        }
        // For CSV, render as a table
        if (asset.mimeType.includes("csv")) {
          const lines = textContent.split("\n").filter(line => line.trim());
          const rows = lines.slice(0, 100).map(line => {
            // Simple CSV parsing (handles basic cases)
            const cells: string[] = [];
            let current = "";
            let inQuotes = false;
            for (const char of line) {
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === "," && !inQuotes) {
                cells.push(current.trim());
                current = "";
              } else {
                current += char;
              }
            }
            cells.push(current.trim());
            return cells;
          });
          const hasMoreRows = lines.length > 100;

          return (
            <div className="w-full max-w-5xl max-h-[calc(100vh-160px)] overflow-auto rounded-lg bg-gray-900/80 border border-white/10">
              <table className="w-full text-sm text-left">
                <thead className="sticky top-0 bg-gray-800 text-white/80 text-xs uppercase">
                  <tr>
                    {rows[0]?.map((cell, i) => (
                      <th key={i} className="px-4 py-3 font-medium border-b border-white/10">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-white/70">
                  {rows.slice(1).map((row, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 whitespace-nowrap">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMoreRows && (
                <div className="px-4 py-2 text-white/50 text-xs text-center border-t border-white/10">
                  Showing first 100 rows of {lines.length} total
                </div>
              )}
            </div>
          );
        }
        // For JSON, try to format it nicely
        if (fileType === "code" && asset.mimeType === "application/json") {
          let formattedJson = textContent;
          try {
            formattedJson = JSON.stringify(JSON.parse(textContent), null, 2);
          } catch {
            // If parsing fails, show raw content
          }
          return (
            <div className="w-full max-w-4xl max-h-[calc(100vh-160px)] overflow-auto rounded-lg bg-gray-900/80 border border-white/10">
              <pre className="p-4 text-sm text-green-300 font-mono whitespace-pre-wrap break-all">
                {formattedJson}
              </pre>
            </div>
          );
        }
        // For other text files
        return (
          <div className="w-full max-w-4xl max-h-[calc(100vh-160px)] overflow-auto rounded-lg bg-gray-900/80 border border-white/10">
            <pre className="p-4 text-sm text-white/80 font-mono whitespace-pre-wrap break-all">
              {textContent}
            </pre>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center gap-6">
            <div className="p-8 rounded-2xl bg-white/5">
              <FileTypeIcon mimeType={asset.mimeType} />
            </div>
            <div className="text-center">
              <p className="text-white/80 font-medium mb-1">{asset.name}</p>
              <p className="text-white/40 text-sm mb-4">Preview not available for this file type</p>
            </div>
            <Button onClick={handleDownload} className="bg-white text-black hover:bg-white/90">
              <Download className="mr-2 h-4 w-4" />
              Download to view
            </Button>
          </div>
        );
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Full-screen dark overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/95 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-0 z-50 flex flex-col outline-none">
          {/* Header - Floating style */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
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
                <DialogPrimitive.Title className="text-white font-medium truncate">
                  {asset.name}
                </DialogPrimitive.Title>
                <p className="text-white/50 text-xs">
                  {formatFileSize(asset.size)}
                  {assets.length > 1 && ` • ${currentIndex + 1} of ${assets.length}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Image controls */}
              {fileType === "image" && previewUrl && !loading && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleZoomOut}
                    disabled={imageZoom <= 0.5}
                  >
                    <ZoomOut className="h-5 w-5" />
                  </Button>
                  <span className="text-white/60 text-sm w-12 text-center">{Math.round(imageZoom * 100)}%</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleZoomIn}
                    disabled={imageZoom >= 3}
                  >
                    <ZoomIn className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full text-white/80 hover:text-white hover:bg-white/10"
                    onClick={handleRotate}
                  >
                    <RotateCw className="h-5 w-5" />
                  </Button>
                  <div className="w-px h-6 bg-white/20 mx-2" />
                </>
              )}
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
          <div className="flex-1 flex items-center justify-center p-4 pt-20 pb-4">
            {renderPreview()}
          </div>

          {/* Navigation arrows - Large circular buttons */}
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
