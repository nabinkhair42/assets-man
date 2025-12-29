"use client";

import { File, Download, FileImage, Film, Music, FileText, FileCode, FileArchive, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/formatters";
import type { PreviewComponentProps } from "./types";
import { getFileType } from "./types";

interface UnsupportedPreviewProps extends PreviewComponentProps {
  className?: string;
  message?: string;
}

function FileTypeIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  const fileType = getFileType(mimeType);

  switch (fileType) {
    case "image":
      return <FileImage className={cn(className, "text-pink-400")} />;
    case "video":
      return <Film className={cn(className, "text-purple-400")} />;
    case "audio":
      return <Music className={cn(className, "text-green-400")} />;
    case "code":
      return <FileCode className={cn(className, "text-yellow-400")} />;
    case "text":
      return mimeType.includes("csv")
        ? <FileSpreadsheet className={cn(className, "text-emerald-400")} />
        : <FileText className={cn(className, "text-orange-400")} />;
    case "pdf":
      return <FileText className={cn(className, "text-red-400")} />;
    case "document":
      return <FileText className={cn(className, "text-blue-400")} />;
    default:
      if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("archive") || mimeType.includes("tar") || mimeType.includes("gz")) {
        return <FileArchive className={cn(className, "text-amber-400")} />;
      }
      return <File className={cn(className, "text-gray-400")} />;
  }
}

export function UnsupportedPreview({
  asset,
  onDownload,
  className,
  message = "Preview not available for this file type"
}: UnsupportedPreviewProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-6 p-8", className)}>
      {/* File icon with animated background */}
      <div className="relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 blur-xl animate-pulse" />
        <div className="relative p-8 rounded-2xl bg-white/5 border border-white/10">
          <FileTypeIcon mimeType={asset.mimeType} className="h-24 w-24" />
        </div>
      </div>

      {/* File info */}
      <div className="text-center max-w-md">
        <p className="text-white font-medium text-lg mb-1 break-all">{asset.name}</p>
        <p className="text-white/50 text-sm mb-1">{formatFileSize(asset.size)}</p>
        <p className="text-white/40 text-sm">{message}</p>
      </div>

      {/* Download button */}
      <Button onClick={onDownload} className="bg-white text-black hover:bg-white/90">
        <Download className="mr-2 h-4 w-4" />
        Download to view
      </Button>

      {/* File type info */}
      <p className="text-white/30 text-xs">
        {asset.mimeType || "Unknown file type"}
      </p>
    </div>
  );
}
