"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  RotateCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PreviewComponentProps } from "./types";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps extends PreviewComponentProps {
  className?: string;
  // Controlled mode props (used when minimal=true)
  minimal?: boolean;
  pageNumber?: number;
  scale?: number;
  rotation?: number;
  onLoadSuccess?: (numPages: number) => void;
}

export function PdfPreview({
  asset,
  previewUrl,
  onDownload,
  className,
  minimal = false,
  pageNumber: controlledPageNumber,
  scale: controlledScale,
  rotation: controlledRotation,
  onLoadSuccess: onLoadSuccessCallback,
}: PdfPreviewProps) {
  // Internal state (used when not in minimal mode)
  const [internalNumPages, setInternalNumPages] = useState<number>(0);
  const [internalPageNumber, setInternalPageNumber] = useState<number>(1);
  const [internalScale, setInternalScale] = useState<number>(1.0);
  const [internalRotation, setInternalRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use controlled or internal state
  const numPages = internalNumPages;
  const pageNumber = minimal ? (controlledPageNumber ?? 1) : internalPageNumber;
  const scale = minimal ? (controlledScale ?? 1.0) : internalScale;
  const rotation = minimal ? (controlledRotation ?? 0) : internalRotation;

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setInternalNumPages(numPages);
    setIsLoading(false);
    setError(null);
    onLoadSuccessCallback?.(numPages);
  }, [onLoadSuccessCallback]);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error("PDF load error:", err);
    setError("Failed to load PDF. Try downloading the file instead.");
    setIsLoading(false);
  }, []);

  // Internal controls (only used when not minimal)
  const goToPrevPage = () => setInternalPageNumber((prev) => Math.max(prev - 1, 1));
  const goToNextPage = () => setInternalPageNumber((prev) => Math.min(prev + 1, numPages));
  const zoomIn = () => setInternalScale((prev) => Math.min(prev + 0.25, 3.0));
  const zoomOut = () => setInternalScale((prev) => Math.max(prev - 0.25, 0.5));
  const rotate = () => setInternalRotation((prev) => (prev + 90) % 360);

  // Minimal mode - just the PDF content, no toolbar
  if (minimal) {
    return (
      <div className={cn("flex items-center justify-center w-full h-full", className)}>
        {error ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center p-8">
            <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <FileText className="h-8 w-8 text-red-500" />
            </div>
            <div>
              <p className="text-muted-foreground font-medium mb-2">Unable to preview PDF</p>
              <p className="text-muted-foreground text-sm mb-4">{error}</p>
              <Button onClick={onDownload} variant="secondary" size="sm">
                <Download className="size-4" />
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-auto max-h-full max-w-full flex items-start justify-center">
            <Document
              file={previewUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="size-8 animate-spin text-muted-foreground/60" />
                  <p className="text-muted-foreground/60 text-sm">Loading PDF...</p>
                </div>
              }
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                className="shadow-2xl"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center w-[600px] h-[800px] bg-white/5 rounded">
                    <Loader2 className="size-6 animate-spin text-muted-foreground/60" />
                  </div>
                }
              />
            </Document>
          </div>
        )}
      </div>
    );
  }

  // Full mode with toolbar (used in public share pages, etc.)
  return (
    <div className={cn("flex flex-col items-center w-full h-full", className)}>
      <div className="relative w-full h-full max-w-5xl flex flex-col rounded-lg overflow-hidden bg-card border border-border">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 bg-muted border-b border-border gap-2">
          {/* Left: File info */}
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="size-4 text-destructive shrink-0" />
            <span className="text-foreground text-sm font-medium truncate max-w-[100px] sm:max-w-xs">
              {asset.name}
            </span>
          </div>

          {/* Center: Page controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-foreground/80 text-sm min-w-[60px] text-center tabular-nums">
              {isLoading ?(<Loader2 className="size-4 animate-spin" />) :(<>{`${pageNumber} / ${numPages}`}</>)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages || isLoading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Right: Zoom & actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent hidden sm:flex"
              onClick={zoomOut}
              disabled={scale <= 0.5 || isLoading}
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground text-xs min-w-[40px] text-center hidden sm:block">
              {Math.round(scale * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent hidden sm:flex"
              onClick={zoomIn}
              disabled={scale >= 3.0 || isLoading}
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent hidden sm:flex"
              onClick={rotate}
              disabled={isLoading}
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            <div className="w-px h-5 bg-border mx-1 hidden sm:block" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
              onClick={onDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div className="flex-1 overflow-auto bg-muted/50 flex items-start justify-center p-4">
          {error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <FileText className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <p className="text-foreground/80 font-medium mb-2">Unable to preview PDF</p>
                <p className="text-muted-foreground text-sm mb-4">{error}</p>
                <Button onClick={onDownload} variant="secondary" size="sm">
                  <Download className="size-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          ) : (
            <Document
              file={previewUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-muted-foreground text-sm">Loading PDF...</p>
                </div>
              }
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                className="shadow-2xl"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex items-center justify-center w-[600px] h-[800px] bg-muted/50 rounded">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                }
              />
            </Document>
          )}
        </div>

        {/* Mobile zoom controls */}
        <div className="sm:hidden flex items-center justify-center gap-2 px-3 py-2 bg-muted border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={zoomOut}
            disabled={scale <= 0.5 || isLoading}
          >
            <ZoomOut className="h-4 w-4 mr-1" />
            Out
          </Button>
          <span className="text-muted-foreground text-xs">{Math.round(scale * 100)}%</span>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={zoomIn}
            disabled={scale >= 3.0 || isLoading}
          >
            <ZoomIn className="h-4 w-4 mr-1" />
            In
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
            onClick={rotate}
            disabled={isLoading}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
