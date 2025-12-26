import type { StorageConfig, StorageClient } from "./types";
import { createS3Client } from "./s3-client";
import { createGCSClient } from "./gcs-client";

export * from "./types";

/**
 * Create a storage client based on the provider configuration
 * Switching providers is as simple as changing the config
 */
export function createStorageClient(config: StorageConfig): StorageClient {
  switch (config.provider) {
    case "s3":
      return createS3Client(config);
    case "gcs":
      return createGCSClient(config);
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}

/**
 * Generate a unique storage key for an asset
 */
export function generateStorageKey(
  userId: string,
  fileName: string,
  folderId?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");

  const prefix = folderId ? `${userId}/${folderId}` : userId;
  return `${prefix}/${timestamp}-${random}-${safeFileName}`;
}

/**
 * Generate a thumbnail storage key
 */
export function generateThumbnailKey(originalKey: string): string {
  const parts = originalKey.split("/");
  const fileName = parts.pop() ?? "";
  return [...parts, "thumbnails", fileName].join("/");
}
