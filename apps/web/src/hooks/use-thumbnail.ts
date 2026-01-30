"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
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

// Query key factory
export const thumbnailKeys = {
  all: ["thumbnails"] as const,
  urls: () => [...thumbnailKeys.all, "url"] as const,
  url: (id: string) => [...thumbnailKeys.urls(), id] as const,
};

interface ThumbnailUrlResult {
  url: string | null;
  canGenerate: boolean;
}

// Module-level batcher
let pendingIds = new Set<string>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let batchResolvers = new Map<
  string,
  { resolve: (result: ThumbnailUrlResult) => void; reject: (err: Error) => void }
>();

function scheduleBatch(queryClient: QueryClient) {
  if (batchTimer) return;
  batchTimer = setTimeout(async () => {
    const ids = Array.from(pendingIds);
    pendingIds = new Set();
    batchTimer = null;
    const resolvers = new Map(batchResolvers);
    batchResolvers = new Map();

    try {
      const results = await assetService.batchGetThumbnailUrls(ids);
      for (const [id, result] of Object.entries(results)) {
        queryClient.setQueryData(thumbnailKeys.url(id), result);
        resolvers.get(id)?.resolve(result);
      }
      // Resolve any IDs that weren't in the response
      for (const [id, resolver] of resolvers) {
        if (!(id in results)) {
          const fallback = { url: null, canGenerate: false };
          queryClient.setQueryData(thumbnailKeys.url(id), fallback);
          resolver.resolve(fallback);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch thumbnail URLs");
      for (const [, resolver] of resolvers) {
        resolver.reject(error);
      }
    }
  }, 50);
}

export function useThumbnailUrl(
  assetId: string,
  mimeType: string,
  thumbnailKey?: string | null
) {
  const queryClient = useQueryClient();
  const canGenerate = canHaveThumbnail(mimeType);

  return useQuery({
    queryKey: thumbnailKeys.url(assetId),
    queryFn: () =>
      new Promise<ThumbnailUrlResult>((resolve, reject) => {
        pendingIds.add(assetId);
        batchResolvers.set(assetId, { resolve, reject });
        scheduleBatch(queryClient);
      }),
    enabled: canGenerate && !!thumbnailKey,
    staleTime: 55 * 60 * 1000, // 55 min (presigned URL valid for 60)
    gcTime: 60 * 60 * 1000, // 60 min
  });
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
