"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { assetService } from "@/services/asset-service";
import { shareService } from "@/services/share-service";
import { useShareContext } from "@/contexts/share-context";

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
  shared: (token: string) => [...thumbnailKeys.all, "shared", token] as const,
  sharedUrl: (token: string, id: string) => [...thumbnailKeys.shared(token), id] as const,
};

interface ThumbnailUrlResult {
  url: string | null;
  canGenerate: boolean;
}

// Module-level batcher for authenticated requests
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

// Module-level batcher for shared/public requests (keyed by token)
const sharedBatchers = new Map<string, {
  pendingIds: Set<string>;
  timer: ReturnType<typeof setTimeout> | null;
  resolvers: Map<string, { resolve: (result: ThumbnailUrlResult) => void; reject: (err: Error) => void }>;
}>();

function getSharedBatcher(token: string) {
  let batcher = sharedBatchers.get(token);
  if (!batcher) {
    batcher = { pendingIds: new Set(), timer: null, resolvers: new Map() };
    sharedBatchers.set(token, batcher);
  }
  return batcher;
}

function scheduleSharedBatch(token: string, queryClient: QueryClient) {
  const batcher = getSharedBatcher(token);
  if (batcher.timer) return;
  batcher.timer = setTimeout(async () => {
    const ids = Array.from(batcher.pendingIds);
    batcher.pendingIds = new Set();
    batcher.timer = null;
    const resolvers = new Map(batcher.resolvers);
    batcher.resolvers = new Map();

    try {
      const results = await shareService.batchGetSharedThumbnailUrls(token, ids);
      for (const [id, result] of Object.entries(results)) {
        queryClient.setQueryData(thumbnailKeys.sharedUrl(token, id), result);
        resolvers.get(id)?.resolve(result);
      }
      for (const [id, resolver] of resolvers) {
        if (!(id in results)) {
          const fallback = { url: null, canGenerate: false };
          queryClient.setQueryData(thumbnailKeys.sharedUrl(token, id), fallback);
          resolver.resolve(fallback);
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch shared thumbnail URLs");
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
  const shareContext = useShareContext();
  const canGenerate = canHaveThumbnail(mimeType);

  const isShared = !!shareContext;
  const token = shareContext?.token ?? "";

  return useQuery({
    queryKey: isShared
      ? thumbnailKeys.sharedUrl(token, assetId)
      : thumbnailKeys.url(assetId),
    queryFn: () =>
      new Promise<ThumbnailUrlResult>((resolve, reject) => {
        if (isShared) {
          const batcher = getSharedBatcher(token);
          batcher.pendingIds.add(assetId);
          batcher.resolvers.set(assetId, { resolve, reject });
          scheduleSharedBatch(token, queryClient);
        } else {
          pendingIds.add(assetId);
          batchResolvers.set(assetId, { resolve, reject });
          scheduleBatch(queryClient);
        }
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
