"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { PreviewComponentProps } from "./types";

interface VideoPreviewProps extends PreviewComponentProps {
  className?: string;
  autoPlay?: boolean;
}

export function VideoPreview({ asset, previewUrl, className, autoPlay = true }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Reset video when asset changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [asset.id, previewUrl]);

  return (
    <div className={cn("flex items-center justify-center w-full h-full p-4", className)}>
      <video
        ref={videoRef}
        src={previewUrl}
        controls
        autoPlay={autoPlay}
        className="max-h-full max-w-full rounded-lg shadow-2xl bg-card"
        style={{ maxHeight: "calc(100vh - 160px)" }}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
