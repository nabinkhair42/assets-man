"use client";

import { useRef, useEffect } from "react";
import { Music, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/formatters";
import type { PreviewComponentProps } from "./types";

interface AudioPreviewProps extends PreviewComponentProps {
  className?: string;
  autoPlay?: boolean;
}

export function AudioPreview({ asset, previewUrl, onDownload, className, autoPlay = true }: AudioPreviewProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Reset audio when asset changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [asset.id, previewUrl]);

  return (
    <div className={cn("flex flex-col items-center justify-center gap-8 p-8", className)}>
      {/* Animated audio icon */}
      <div className="relative">
        <div className="p-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
          <Music className="h-20 w-20 text-green-500" />
        </div>
        {/* Animated rings */}
        <div className="absolute inset-0 rounded-full border-2 border-green-500/20 animate-ping" style={{ animationDuration: "2s" }} />
        <div className="absolute inset-2 rounded-full border border-green-500/10 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
      </div>

      {/* File info */}
      <div className="text-center">
        <p className="text-foreground font-medium text-lg mb-1 max-w-md truncate">{asset.name}</p>
        <p className="text-muted-foreground text-sm">{formatFileSize(asset.size)}</p>
      </div>

      {/* Audio player */}
      <audio
        ref={audioRef}
        src={previewUrl}
        controls
        autoPlay={autoPlay}
        className="w-full max-w-lg"
      >
        Your browser does not support the audio tag.
      </audio>

      {/* Download button */}
      <Button
        onClick={onDownload}
        variant="outline"
      >
        <Download className="mr-2 h-4 w-4" />
        Download
      </Button>
    </div>
  );
}
