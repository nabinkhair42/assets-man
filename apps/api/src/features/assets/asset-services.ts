import { eq, and, isNull, isNotNull, count, or, asc, desc, sql, type SQL } from "drizzle-orm";
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

export interface AssetWithScore extends Asset {
  relevanceScore?: number;
}

export interface PaginatedAssets {
  assets: AssetWithScore[];
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
  const { url } = await storage.getPresignedDownloadUrl({
    key: asset.storageKey,
    expiresIn: 3600,
    filename: asset.name,
  });

  return { url, asset };
}

function getAssetSortColumn(sortBy: string) {
  switch (sortBy) {
    case "name":
      return assets.name;
    case "size":
      return assets.size;
    case "updatedAt":
      return assets.updatedAt;
    case "createdAt":
    default:
      return assets.createdAt;
  }
}

export async function listAssets(
  userId: string,
  query: ListAssetsQuery
): Promise<PaginatedAssets> {
  const { folderId, search, page, limit, sortBy, sortOrder } = query;
  const offset = (page - 1) * limit;

  // If searching, use fuzzy search with pg_trgm
  if (search) {
    const searchTerm = search.trim().toLowerCase();
    const likePattern = `%${searchTerm}%`;

    // Fuzzy condition: similarity > threshold OR contains substring
    const fuzzyCondition = sql`(
      GREATEST(
        similarity(lower(${assets.name}), ${searchTerm}),
        similarity(lower(${assets.originalName}), ${searchTerm})
      ) > 0.1
      OR lower(${assets.name}) LIKE ${likePattern}
      OR lower(${assets.originalName}) LIKE ${likePattern}
    )`;

    // Count total matching assets
    const [countResult] = await db
      .select({ count: count() })
      .from(assets)
      .where(and(
        eq(assets.ownerId, userId),
        isNull(assets.trashedAt),
        fuzzyCondition
      ));

    const total = countResult?.count ?? 0;

    // Get assets with relevance score, ordered by relevance
    const results = await db
      .select({
        id: assets.id,
        name: assets.name,
        originalName: assets.originalName,
        mimeType: assets.mimeType,
        size: assets.size,
        storageKey: assets.storageKey,
        folderId: assets.folderId,
        ownerId: assets.ownerId,
        thumbnailKey: assets.thumbnailKey,
        isStarred: assets.isStarred,
        trashedAt: assets.trashedAt,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
        relevanceScore: sql<number>`GREATEST(
          similarity(lower(${assets.name}), ${searchTerm}),
          similarity(lower(${assets.originalName}), ${searchTerm})
        )`,
      })
      .from(assets)
      .where(and(
        eq(assets.ownerId, userId),
        isNull(assets.trashedAt),
        fuzzyCondition
      ))
      .orderBy(sql`GREATEST(
        similarity(lower(${assets.name}), ${searchTerm}),
        similarity(lower(${assets.originalName}), ${searchTerm})
      ) DESC`)
      .limit(limit)
      .offset(offset);

    return {
      assets: results.map(r => ({
        ...r,
        relevanceScore: r.relevanceScore,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Non-search query - filter by folder
  const baseConditions = [
    eq(assets.ownerId, userId),
    isNull(assets.trashedAt),
  ];

  if (folderId) {
    baseConditions.push(eq(assets.folderId, folderId));
  } else {
    baseConditions.push(isNull(assets.folderId));
  }

  const whereClause = and(...baseConditions);

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(assets)
    .where(whereClause);

  const total = countResult?.count ?? 0;

  // Build order by clause
  const sortColumn = getAssetSortColumn(sortBy);
  const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  // Get assets
  const assetList = await db.query.assets.findMany({
    where: whereClause,
    orderBy: orderByClause,
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

  // Move to trash (soft delete)
  await db
    .update(assets)
    .set({ trashedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)));
}

export async function restoreAsset(
  userId: string,
  assetId: string
): Promise<Asset> {
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.ownerId, userId), isNotNull(assets.trashedAt)),
  });

  if (!asset) {
    throw new Error("NOT_FOUND");
  }

  const [restored] = await db
    .update(assets)
    .set({ trashedAt: null, updatedAt: new Date() })
    .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)))
    .returning();

  if (!restored) {
    throw new Error("INTERNAL_ERROR");
  }

  return restored;
}

export async function listTrashedAssets(
  userId: string,
  query: { page: number; limit: number }
): Promise<PaginatedAssets> {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Get total count of trashed assets
  const [countResult] = await db
    .select({ count: count() })
    .from(assets)
    .where(and(eq(assets.ownerId, userId), isNotNull(assets.trashedAt)));

  const total = countResult?.count ?? 0;

  // Get trashed assets
  const assetList = await db.query.assets.findMany({
    where: and(eq(assets.ownerId, userId), isNotNull(assets.trashedAt)),
    orderBy: (assets, { desc }) => [desc(assets.trashedAt)],
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

export async function permanentlyDeleteAsset(
  userId: string,
  assetId: string
): Promise<void> {
  const asset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.ownerId, userId), isNotNull(assets.trashedAt)),
  });

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

export async function emptyTrashAssets(userId: string): Promise<number> {
  const trashedAssets = await db.query.assets.findMany({
    where: and(eq(assets.ownerId, userId), isNotNull(assets.trashedAt)),
  });

  if (trashedAssets.length === 0) return 0;

  const storage = getStorage();
  const keys = trashedAssets.map((a) => a.storageKey);
  const thumbnailKeys = trashedAssets
    .filter((a) => a.thumbnailKey)
    .map((a) => a.thumbnailKey as string);

  // Delete from storage
  await storage.deleteObjects([...keys, ...thumbnailKeys]);

  // Delete from database
  await db
    .delete(assets)
    .where(and(eq(assets.ownerId, userId), isNotNull(assets.trashedAt)));

  return trashedAssets.length;
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

export async function toggleStarred(
  userId: string,
  assetId: string
): Promise<Asset> {
  const asset = await getAssetById(userId, assetId);

  if (!asset) {
    throw new Error("NOT_FOUND");
  }

  const [updated] = await db
    .update(assets)
    .set({ isStarred: !asset.isStarred, updatedAt: new Date() })
    .where(and(eq(assets.id, assetId), eq(assets.ownerId, userId)))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}

export async function listStarredAssets(
  userId: string,
  query: { page: number; limit: number }
): Promise<PaginatedAssets> {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Get total count
  const [countResult] = await db
    .select({ count: count() })
    .from(assets)
    .where(and(eq(assets.ownerId, userId), eq(assets.isStarred, true), isNull(assets.trashedAt)));

  const total = countResult?.count ?? 0;

  // Get starred assets
  const assetList = await db.query.assets.findMany({
    where: and(eq(assets.ownerId, userId), eq(assets.isStarred, true), isNull(assets.trashedAt)),
    orderBy: (assets, { desc }) => [desc(assets.updatedAt)],
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
