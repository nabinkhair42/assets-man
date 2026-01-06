import { eq, and, isNull, isNotNull, count, or, asc, desc, sql, inArray } from "drizzle-orm";
import { createDb, assets, folders, shares, users, type Asset, type Folder } from "@repo/database";
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
import {
  incrementUsedStorage,
  decrementUsedStorage,
  checkQuotaAvailable,
} from "@/features/storage/storage-services.js";

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

  // Increment user's storage usage
  await incrementUsedStorage(userId, input.size);

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

// Get download URL for an asset shared with the user (or owned by user)
export async function getSharedAssetDownloadUrl(
  userId: string,
  assetId: string
): Promise<{ url: string; asset: Asset }> {
  // First try owned asset
  const ownedAsset = await db.query.assets.findFirst({
    where: and(eq(assets.id, assetId), eq(assets.ownerId, userId)),
  });

  if (ownedAsset) {
    const storage = getStorage();
    const { url } = await storage.getPresignedDownloadUrl({
      key: ownedAsset.storageKey,
      expiresIn: 3600,
      filename: ownedAsset.name,
    });
    return { url, asset: ownedAsset };
  }

  // Check if asset is shared with user
  const share = await db.query.shares.findFirst({
    where: and(
      eq(shares.assetId, assetId),
      eq(shares.sharedWithUserId, userId),
      or(isNull(shares.expiresAt), sql`${shares.expiresAt} > NOW()`)
    ),
    with: {
      asset: true,
    },
  });

  if (!share?.asset) {
    throw new Error("NOT_FOUND");
  }

  const storage = getStorage();
  const { url } = await storage.getPresignedDownloadUrl({
    key: share.asset.storageKey,
    expiresIn: 3600,
    filename: share.asset.name,
  });

  return { url, asset: share.asset };
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

  // Decrement user's storage usage
  await decrementUsedStorage(userId, asset.size);
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

  // Calculate total size to decrement
  const totalSize = trashedAssets.reduce((sum, a) => sum + a.size, 0);

  // Delete from storage
  await storage.deleteObjects([...keys, ...thumbnailKeys]);

  // Delete from database
  await db
    .delete(assets)
    .where(and(eq(assets.ownerId, userId), isNotNull(assets.trashedAt)));

  // Decrement user's storage usage
  await decrementUsedStorage(userId, totalSize);

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

  // Calculate total size to decrement
  const totalSize = folderAssets.reduce((sum, a) => sum + a.size, 0);

  // Delete from storage
  await storage.deleteObjects([...keys, ...thumbnailKeys]);

  // Delete from database
  await db
    .delete(assets)
    .where(and(eq(assets.folderId, folderId), eq(assets.ownerId, userId)));

  // Decrement user's storage usage
  await decrementUsedStorage(userId, totalSize);
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

export async function copyAsset(
  userId: string,
  assetId: string,
  targetFolderId: string | null | undefined
): Promise<Asset> {
  const asset = await getAssetById(userId, assetId);

  if (!asset) {
    throw new Error("NOT_FOUND");
  }

  // Check storage quota before copying
  const quotaCheck = await checkQuotaAvailable(userId, asset.size);
  if (!quotaCheck.available) {
    throw new Error("QUOTA_EXCEEDED");
  }

  // Verify target folder exists if provided
  if (targetFolderId) {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, targetFolderId), eq(folders.ownerId, userId)),
    });

    if (!folder) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }

  // Generate new storage key for the copy
  const newStorageKey = generateStorageKey(userId, asset.name, targetFolderId ?? undefined);

  // Copy the file in storage
  const storage = getStorage();
  await storage.copyObject(asset.storageKey, newStorageKey);

  // Copy thumbnail if exists
  let newThumbnailKey: string | null = null;
  if (asset.thumbnailKey) {
    newThumbnailKey = generateStorageKey(userId, `thumb_${asset.name}`, targetFolderId ?? undefined);
    await storage.copyObject(asset.thumbnailKey, newThumbnailKey);
  }

  // Generate a unique name if there's a conflict
  let copyName = `${asset.name} (copy)`;
  const existingWithName = await db.query.assets.findFirst({
    where: and(
      eq(assets.ownerId, userId),
      eq(assets.name, copyName),
      targetFolderId ? eq(assets.folderId, targetFolderId) : isNull(assets.folderId)
    ),
  });

  if (existingWithName) {
    copyName = `${asset.name} (copy ${Date.now()})`;
  }

  // Create new asset record
  const [newAsset] = await db
    .insert(assets)
    .values({
      name: copyName,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      storageKey: newStorageKey,
      folderId: targetFolderId ?? null,
      ownerId: userId,
      thumbnailKey: newThumbnailKey,
    })
    .returning();

  if (!newAsset) {
    throw new Error("INTERNAL_ERROR");
  }

  // Increment user's storage usage for the copied asset
  await incrementUsedStorage(userId, asset.size);

  return newAsset;
}

export interface BulkDownloadAsset {
  asset: Asset;
  path: string; // Path within the ZIP (includes folder structure)
}

// Helper to get all descendants of a folder
async function getFolderDescendants(
  userId: string,
  folderId: string,
  basePath: string = ""
): Promise<{ assets: BulkDownloadAsset[]; folders: { folder: Folder; path: string }[] }> {
  const folder = await db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
  });

  if (!folder) {
    return { assets: [], folders: [] };
  }

  const folderPath = basePath ? `${basePath}/${folder.name}` : folder.name;
  const result: { assets: BulkDownloadAsset[]; folders: { folder: Folder; path: string }[] } = {
    assets: [],
    folders: [{ folder, path: folderPath }],
  };

  // Get assets in this folder
  const folderAssets = await db.query.assets.findMany({
    where: and(eq(assets.folderId, folderId), eq(assets.ownerId, userId), isNull(assets.trashedAt)),
  });

  for (const asset of folderAssets) {
    result.assets.push({
      asset,
      path: `${folderPath}/${asset.name}`,
    });
  }

  // Get subfolders
  const subfolders = await db.query.folders.findMany({
    where: and(eq(folders.parentId, folderId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
  });

  // Recursively get descendants of subfolders
  for (const subfolder of subfolders) {
    const subResult = await getFolderDescendants(userId, subfolder.id, folderPath);
    result.assets.push(...subResult.assets);
    result.folders.push(...subResult.folders);
  }

  return result;
}

export async function getBulkDownloadAssets(
  userId: string,
  assetIds: string[],
  folderIds: string[]
): Promise<BulkDownloadAsset[]> {
  const result: BulkDownloadAsset[] = [];
  const addedAssetIds = new Set<string>();

  // Get directly selected assets
  if (assetIds.length > 0) {
    const selectedAssets = await db.query.assets.findMany({
      where: and(
        eq(assets.ownerId, userId),
        isNull(assets.trashedAt),
        inArray(assets.id, assetIds)
      ),
    });

    for (const asset of selectedAssets) {
      if (!addedAssetIds.has(asset.id)) {
        result.push({ asset, path: asset.name });
        addedAssetIds.add(asset.id);
      }
    }
  }

  // Get assets from selected folders (including all descendants)
  for (const folderId of folderIds) {
    const folderContents = await getFolderDescendants(userId, folderId);
    for (const item of folderContents.assets) {
      if (!addedAssetIds.has(item.asset.id)) {
        result.push(item);
        addedAssetIds.add(item.asset.id);
      }
    }
  }

  return result;
}

export function getStorageForBulkDownload(): StorageClient {
  return getStorage();
}

// Get shared assets for bulk download (assets shared with the user, not owned by them)
export async function getSharedBulkDownloadAssets(
  userId: string,
  assetIds: string[]
): Promise<BulkDownloadAsset[]> {
  if (assetIds.length === 0) return [];

  // Get user email for share lookup
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return [];

  const result: BulkDownloadAsset[] = [];

  // For each asset, check if it's shared with the user
  for (const assetId of assetIds) {
    // Check if there's a share for this asset that the user has access to
    const share = await db.query.shares.findFirst({
      where: and(
        eq(shares.assetId, assetId),
        eq(shares.shareType, "user"),
        or(
          eq(shares.sharedWithUserId, userId),
          eq(shares.sharedWithEmail, user.email)
        )
      ),
      with: {
        asset: true,
      },
    });

    if (share?.asset && !share.asset.trashedAt) {
      result.push({
        asset: share.asset,
        path: share.asset.name,
      });
    }
  }

  return result;
}
