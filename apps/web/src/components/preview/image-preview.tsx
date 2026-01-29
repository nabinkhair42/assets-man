"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PreviewComponentProps } from "./types";
import { ZoomOut, ZoomIn, RotateCw, Maximize2 } from "lucide-react";

interface ImagePreviewProps extends PreviewComponentProps {
  className?: string;
}

export function ImagePreview({ asset, previewUrl, className }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const [prevAssetId, setPrevAssetId] = useState(asset.id);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when asset changes (using the recommended pattern)
  if (prevAssetId !== asset.id) {
    setPrevAssetId(asset.id);
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(prev + 0.25, 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const newZoom = Math.max(prev - 0.25, 0.25);
      // Reset position if zooming out to fit
      if (newZoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  // Handle wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(Math.max(prev + delta, 0.25), 5));
  }, []);

  // Attach native wheel listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Handle drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        handleRotate();
      } else if (e.key === "0") {
        e.preventDefault();
        handleReset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleRotate, handleReset]);

  return (
    <div className={cn("relative flex flex-col items-center justify-center w-full h-full", className)}>
      {/* Image container */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 w-full flex items-center justify-center overflow-hidden",
          zoom > 1 && "cursor-grab",
          isDragging && "cursor-grabbing"
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          ref={imageRef}
          src={previewUrl}
          alt={asset.name}
          className="max-h-full max-w-full object-contain transition-transform duration-200 select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: "center center",
          }}
          draggable={false}
        />
      </div>

      {/* Zoom controller - Bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
        <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-background/80 backdrop-blur-xl border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={handleZoomOut}
            disabled={zoom <= 0.25}
          >
            <ZoomOut className="size-4" />
          </Button>

          <button
            onClick={handleReset}
            className="min-w-14 px-2 py-1 text-sm font-medium rounded transition-colors text-foreground hover:bg-accent"
          >
            {Math.round(zoom * 100)}%
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={handleZoomIn}
            disabled={zoom >= 5}
          >
            <ZoomIn className="size-4" />
          </Button>

          <div className="w-px h-5 bg-border mx-1" />

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={handleRotate}
          >
            <RotateCw className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={handleReset}
            title="Reset (0)"
          >
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
