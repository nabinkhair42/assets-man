"use client";

import { useState, useEffect, useCallback } from "react";
import { assetService } from "@/services/asset-service";

// MIME types that support thumbnails
const THUMBNAIL_SUPPORTED_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  // PDFs
  "application/pdf",
];

export function canHaveThumbnail(mimeType: string): boolean {
  return THUMBNAIL_SUPPORTED_TYPES.includes(mimeType);
}

interface UseThumbnailOptions {
  assetId: string;
  mimeType: string;
  thumbnailKey?: string | null;
  autoGenerate?: boolean;
}

interface UseThumbnailResult {
  thumbnailUrl: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  generate: () => Promise<void>;
}

export function useThumbnail({
  assetId,
  mimeType,
  thumbnailKey,
  autoGenerate = true,
}: UseThumbnailOptions): UseThumbnailResult {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAttemptedGeneration, setHasAttemptedGeneration] = useState(false);

  const canGenerate = canHaveThumbnail(mimeType);

  // Fetch thumbnail URL
  const fetchThumbnail = useCallback(async () => {
    if (!canGenerate) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await assetService.getThumbnailUrl(assetId);
      if (result.url) {
        setThumbnailUrl(result.url);
      } else if (autoGenerate && result.canGenerate && !hasAttemptedGeneration) {
        // Auto-generate thumbnail if it doesn't exist
        setHasAttemptedGeneration(true);
        await generateThumbnail();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch thumbnail");
    } finally {
      setIsLoading(false);
    }
  }, [assetId, canGenerate, autoGenerate, hasAttemptedGeneration]);

  // Generate thumbnail
  const generateThumbnail = useCallback(async () => {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    setError(null);

    try {
      await assetService.generateThumbnail(assetId);
      // Fetch the new thumbnail URL after generation
      const result = await assetService.getThumbnailUrl(assetId);
      if (result.url) {
        setThumbnailUrl(result.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate thumbnail");
    } finally {
      setIsGenerating(false);
    }
  }, [assetId, canGenerate, isGenerating]);

  // Fetch thumbnail on mount or when thumbnailKey changes
  useEffect(() => {
    if (thumbnailKey) {
      // If we have a thumbnail key, fetch the URL
      fetchThumbnail();
    } else if (canGenerate && autoGenerate && !hasAttemptedGeneration) {
      // If no thumbnail but can generate, try to generate
      fetchThumbnail();
    }
  }, [assetId, thumbnailKey, canGenerate, autoGenerate]);

  return {
    thumbnailUrl,
    isLoading,
    isGenerating,
    error,
    generate: generateThumbnail,
  };
}

// Hook for batch thumbnail generation after upload
export function useGenerateThumbnailAfterUpload() {
  const generateForAsset = useCallback(async (assetId: string, mimeType: string) => {
    if (!canHaveThumbnail(mimeType)) return;

    try {
      await assetService.generateThumbnail(assetId);
    } catch (err) {
      console.error(`Failed to generate thumbnail for asset ${assetId}:`, err);
    }
  }, []);

  return { generateForAsset };
}
