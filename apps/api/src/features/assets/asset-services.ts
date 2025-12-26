import { eq, and, isNull, count } from "drizzle-orm";
import { createDb, assets, folders, type Asset } from "@repo/database";
import {
  createStorageClient,
  generateStorageKey,
  type StorageClient,
} from "@repo/storage";
import { config, getStorageConfig } from "@/config/env.js";
import type {
  RequestUploadInput,
  UpdateAssetInput,
  ListAssetsQuery,
} from "@/schema/asset-schema.js";

const db = createDb(config.DATABASE_URL);

let storageClient: StorageClient | null = null;

function getStorage(): StorageClient {
  if (!storageClient) {
    storageClient = createStorageClient(getStorageConfig());
  }
  return storageClient;
}

export interface UploadUrlResult {
  uploadUrl: string;
  asset: Asset;
}

export interface PaginatedAssets {
  assets: Asset[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function requestUpload(
  userId: string,
  input: RequestUploadInput
): Promise<UploadUrlResult> {
  // Verify folder exists if provided
  if (input.folderId) {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, input.folderId), eq(folders.ownerId, userId)),
    });

    if (!folder) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }

  // Generate storage key
  const storageKey = generateStorageKey(userId, input.fileName, input.folderId);

  // Create asset record
  const [asset] = await db
    .insert(assets)
    .values({
      name: input.fileName,
      originalName: input.fileName,
      mimeType: input.mimeType,
      size: input.size,
      storageKey,
      folderId: input.folderId ?? null,
      ownerId: userId,
    })
    .returning();

  if (!asset) {
    throw new Error("INTERNAL_ERROR");
  }

  // Get presigned upload URL
  const storage = getStorage();
  const { url } = await storage.getPresignedUploadUrl({
    key: storageKey,
    contentType: input.mimeType,
    expiresIn: 3600, // 1 hour
  });

  return {
    uploadUrl: url,
    asset,
  };
}

export async function getAssetById(
  userId: string,
  assetId: string
): Promise<Asset | null> {
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.ownerId, userId)),
  });

  return asset ?? null;
}

export async function getDownloadUrl(
  userId: string,
  assetId: string
): Promise<{ url: string; asset: Asset }> {
  const asset = await getAssetById(userId, assetId);

  if (!asset) {
    throw new Error("NOT_FOUND");
  }

  const storage = getStorage();
  const { url } = await storage.getPresignedDownloadUrl(asset.storageKey, 3600);

  return { url, asset };
}

export async function listAssets(
  userId: string,
  query: ListAssetsQuery
): Promise<PaginatedAssets> {
  const { folderId, page, limit } = query;
  const offset = (page - 1) * limit;

  // Build where clause
  const whereClause = folderId
    ? and(eq(assets.folderId, folderId), eq(assets.ownerId, userId))
    : and(isNull(assets.folderId), eq(assets.ownerId, userId));

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(assets)
    .where(whereClause);

  const total = countResult?.count ?? 0;

  // Get assets
  const assetList = await db.query.assets.findMany({
    where: whereClause,
    orderBy: (assets, { desc }) => [desc(assets.createdAt)],
    limit,
    offset,
  });

  return {
    assets: assetList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function updateAsset(
  userId: string,
  assetId: string,
  input: UpdateAssetInput
): Promise<Asset> {
  const asset = await getAssetById(userId, assetId);

  if (!asset) {
    throw new Error("NOT_FOUND");
  }

  // Verify new folder exists if provided
  if (input.folderId) {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, input.folderId), eq(folders.ownerId, userId)),
    });

    if (!folder) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }

  const updates: Partial<Asset> = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.folderId !== undefined) {
    updates.folderId = input.folderId;
  }

  const [updated] = await db
    .update(assets)
    .set(updates)
    .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}

export async function deleteAsset(
  userId: string,
  assetId: string
): Promise<void> {
  const asset = await getAssetById(userId, assetId);

  if (!asset) {
    throw new Error("NOT_FOUND");
  }

  // Delete from storage
  const storage = getStorage();
  await storage.deleteObject(asset.storageKey);

  // Delete thumbnail if exists
  if (asset.thumbnailKey) {
    await storage.deleteObject(asset.thumbnailKey);
  }

  // Delete from database
  await db
    .delete(assets)
    .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)));
}

export async function deleteAssetsByFolder(
  userId: string,
  folderId: string
): Promise<void> {
  const folderAssets = await db.query.assets.findMany({
    where: and(eq(assets.folderId, folderId), eq(assets.ownerId, userId)),
  });

  if (folderAssets.length === 0) return;

  const storage = getStorage();
  const keys = folderAssets.map((a) => a.storageKey);
  const thumbnailKeys = folderAssets
    .filter((a) => a.thumbnailKey)
    .map((a) => a.thumbnailKey as string);

  // Delete from storage
  await storage.deleteObjects([...keys, ...thumbnailKeys]);

  // Delete from database
  await db
    .delete(assets)
    .where(and(eq(assets.folderId, folderId), eq(assets.ownerId, userId)));
}
