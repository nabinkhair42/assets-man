"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/formatters";
import type { PreviewComponentProps } from "./types";

interface PdfPreviewProps extends PreviewComponentProps {
  className?: string;
}

export function PdfPreview({ asset, previewUrl, onDownload, className }: PdfPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reset loading state when asset changes
  useEffect(() => {
    setIsLoading(true);
  }, [asset.id, previewUrl]);

  const handleOpenInNewTab = () => {
    window.open(previewUrl, "_blank");
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className={cn("flex flex-col items-center justify-center w-full h-full p-4", className)}>
      {/* PDF viewer container */}
      <div className="relative w-full h-full max-w-5xl flex flex-col rounded-lg overflow-hidden bg-gray-900/50 border border-white/10">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/10">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-red-400" />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate max-w-xs">{asset.name}</p>
              <p className="text-white/40 text-xs">{formatFileSize(asset.size)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={handleOpenInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70 hover:text-white hover:bg-white/10"
              onClick={onDownload}
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF iframe - using browser's native PDF viewer */}
        <div className="flex-1 w-full min-h-0 relative bg-gray-800">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-t-white border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                </div>
                <p className="text-white/60 text-sm">Loading PDF...</p>
              </div>
            </div>
          )}
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title={asset.name}
            onLoad={handleIframeLoad}
          />
        </div>

        {/* Help text */}
        <div className="px-4 py-2 bg-black/40 border-t border-white/10">
          <p className="text-white/40 text-xs text-center">
            PDF not displaying correctly?{" "}
            <button
              onClick={handleOpenInNewTab}
              className="text-white/60 hover:text-white underline"
            >
              Open in new tab
            </button>
            {" "}or{" "}
            <button
              onClick={onDownload}
              className="text-white/60 hover:text-white underline"
            >
              download
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
