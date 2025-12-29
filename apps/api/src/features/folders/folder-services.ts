import { eq, and, isNull, isNotNull, count, asc, desc, sql } from "drizzle-orm";
import { createDb, folders, assets, type Folder } from "@repo/database";
import { config, getStorageConfig } from "@/config/env.js";
import { createStorageClient, generateStorageKey, type StorageClient } from "@repo/storage";
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
  FolderContentsQuery,
} from "@/schema/folder-schema.js";

const db = createDb(config.DATABASE_URL);

let storageClient: StorageClient | null = null;

function getStorage(): StorageClient {
  if (!storageClient) {
    storageClient = createStorageClient(getStorageConfig());
  }
  return storageClient;
}

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
}

function buildPath(parentPath: string | null, name: string): string {
  return parentPath ? `${parentPath}/${name}` : `/${name}`;
}

/**
 * Updates all descendant folder paths when a parent folder's path changes.
 * This handles both rename and move operations.
 *
 * @param userId - The owner's user ID
 * @param oldPath - The old path of the parent folder
 * @param newPath - The new path of the parent folder
 */
async function updateChildPaths(
  userId: string,
  oldPath: string,
  newPath: string
): Promise<number> {
  if (oldPath === newPath) return 0;

  // Find all folders whose path starts with the old path followed by "/"
  // This ensures we only get descendants, not the folder itself
  const childFolders = await db.query.folders.findMany({
    where: and(
      eq(folders.ownerId, userId),
      sql`${folders.path} LIKE ${oldPath + '/%'}`
    ),
  });

  if (childFolders.length === 0) return 0;

  // Update each child folder's path by replacing the old prefix with new prefix
  for (const child of childFolders) {
    const updatedPath = newPath + child.path.substring(oldPath.length);

    await db
      .update(folders)
      .set({ path: updatedPath, updatedAt: new Date() })
      .where(eq(folders.id, child.id));
  }

  return childFolders.length;
}

export async function createFolder(
  userId: string,
  input: CreateFolderInput
): Promise<Folder> {
  let parentPath: string | null = null;

  if (input.parentId) {
    const parent = await db.query.folders.findFirst({
      where: and(eq(folders.id, input.parentId), eq(folders.ownerId, userId)),
    });

    if (!parent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    parentPath = parent.path;
  }

  const path = buildPath(parentPath, input.name);

  const [folder] = await db
    .insert(folders)
    .values({
      name: input.name,
      parentId: input.parentId ?? null,
      ownerId: userId,
      path,
    })
    .returning();

  if (!folder) {
    throw new Error("INTERNAL_ERROR");
  }

  return folder;
}

export async function getFolderById(
  userId: string,
  folderId: string
): Promise<Folder | null> {
  const folder = await db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.ownerId, userId)),
  });

  return folder ?? null;
}

function getFolderSortColumn(sortBy: string) {
  switch (sortBy) {
    case "createdAt":
      return folders.createdAt;
    case "updatedAt":
      return folders.updatedAt;
    case "name":
    default:
      return folders.name;
  }
}

export async function getFolderContents(
  userId: string,
  query: FolderContentsQuery
): Promise<Folder[]> {
  const { parentId, sortBy, sortOrder } = query;

  const sortColumn = getFolderSortColumn(sortBy);
  const orderByClause = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

  if (parentId) {
    return db.query.folders.findMany({
      where: and(eq(folders.parentId, parentId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
      orderBy: orderByClause,
    });
  }

  // Root level folders - exclude trashed
  return db.query.folders.findMany({
    where: and(isNull(folders.parentId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
    orderBy: orderByClause,
  });
}

export async function updateFolder(
  userId: string,
  folderId: string,
  input: UpdateFolderInput
): Promise<Folder> {
  const existing = await getFolderById(userId, folderId);

  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const updates: Partial<Folder> = {
    updatedAt: new Date(),
  };

  const oldPath = existing.path;
  let newPath = oldPath;

  if (input.name && input.name !== existing.name) {
    updates.name = input.name;
    // Update path
    const parentPath = existing.parentId
      ? existing.path.substring(0, existing.path.lastIndexOf("/"))
      : null;
    newPath = buildPath(parentPath, input.name);
    updates.path = newPath;
  }

  const [updated] = await db
    .update(folders)
    .set(updates)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  // Update child folder paths if the folder was renamed
  if (oldPath !== newPath) {
    await updateChildPaths(userId, oldPath, newPath);
  }

  return updated;
}

export async function moveFolder(
  userId: string,
  folderId: string,
  input: MoveFolderInput
): Promise<Folder> {
  const folder = await getFolderById(userId, folderId);

  if (!folder) {
    throw new Error("NOT_FOUND");
  }

  // Prevent moving to self
  if (input.parentId === folderId) {
    throw new Error("INVALID_MOVE");
  }

  const oldPath = folder.path;
  let newPath: string;

  if (input.parentId) {
    const newParent = await getFolderById(userId, input.parentId);
    if (!newParent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    // Prevent moving to child
    if (newParent.path.startsWith(folder.path)) {
      throw new Error("INVALID_MOVE");
    }

    newPath = buildPath(newParent.path, folder.name);
  } else {
    newPath = buildPath(null, folder.name);
  }

  const [updated] = await db
    .update(folders)
    .set({
      parentId: input.parentId,
      path: newPath,
      updatedAt: new Date(),
    })
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  // Update child folder paths if the folder was moved
  if (oldPath !== newPath) {
    await updateChildPaths(userId, oldPath, newPath);
  }

  return updated;
}

export async function deleteFolder(
  userId: string,
  folderId: string
): Promise<void> {
  const folder = await getFolderById(userId, folderId);

  if (!folder) {
    throw new Error("NOT_FOUND");
  }

  // Move to trash (soft delete)
  await db
    .update(folders)
    .set({ trashedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)));
}

export async function getAllFolders(userId: string): Promise<Folder[]> {
  return db.query.folders.findMany({
    where: and(eq(folders.ownerId, userId), isNull(folders.trashedAt)),
    orderBy: (folders, { asc }) => [asc(folders.path)],
  });
}

export interface PaginatedFolders {
  folders: Folder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function restoreFolder(
  userId: string,
  folderId: string
): Promise<Folder> {
  const folder = await db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.ownerId, userId), isNotNull(folders.trashedAt)),
  });

  if (!folder) {
    throw new Error("NOT_FOUND");
  }

  const [restored] = await db
    .update(folders)
    .set({ trashedAt: null, updatedAt: new Date() })
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
    .returning();

  if (!restored) {
    throw new Error("INTERNAL_ERROR");
  }

  return restored;
}

export async function listTrashedFolders(
  userId: string,
  query: { page: number; limit: number }
): Promise<PaginatedFolders> {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Get total count of trashed folders
  const [countResult] = await db
    .select({ count: count() })
    .from(folders)
    .where(and(eq(folders.ownerId, userId), isNotNull(folders.trashedAt)));

  const total = countResult?.count ?? 0;

  // Get trashed folders
  const folderList = await db.query.folders.findMany({
    where: and(eq(folders.ownerId, userId), isNotNull(folders.trashedAt)),
    orderBy: (folders, { desc }) => [desc(folders.trashedAt)],
    limit,
    offset,
  });

  return {
    folders: folderList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function permanentlyDeleteFolder(
  userId: string,
  folderId: string
): Promise<void> {
  const folder = await db.query.folders.findFirst({
    where: and(eq(folders.id, folderId), eq(folders.ownerId, userId), isNotNull(folders.trashedAt)),
  });

  if (!folder) {
    throw new Error("NOT_FOUND");
  }

  // Cascade delete is handled by database
  await db
    .delete(folders)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)));
}

export async function emptyTrashFolders(userId: string): Promise<number> {
  const trashedFolders = await db.query.folders.findMany({
    where: and(eq(folders.ownerId, userId), isNotNull(folders.trashedAt)),
  });

  if (trashedFolders.length === 0) return 0;

  // Delete from database (cascade will delete child folders and assets)
  await db
    .delete(folders)
    .where(and(eq(folders.ownerId, userId), isNotNull(folders.trashedAt)));

  return trashedFolders.length;
}

export interface FolderWithScore extends Folder {
  relevanceScore?: number;
}

export async function searchFolders(
  userId: string,
  search: string,
  limit: number = 10
): Promise<FolderWithScore[]> {
  const searchTerm = search.trim().toLowerCase();
  const likePattern = `%${searchTerm}%`;

  // Fuzzy match or exact substring match
  const fuzzyCondition = sql`(
    similarity(lower(${folders.name}), ${searchTerm}) > 0.1
    OR lower(${folders.name}) LIKE ${likePattern}
  )`;

  const results = await db
    .select({
      id: folders.id,
      name: folders.name,
      parentId: folders.parentId,
      ownerId: folders.ownerId,
      path: folders.path,
      isStarred: folders.isStarred,
      trashedAt: folders.trashedAt,
      createdAt: folders.createdAt,
      updatedAt: folders.updatedAt,
      relevanceScore: sql<number>`similarity(lower(${folders.name}), ${searchTerm})`,
    })
    .from(folders)
    .where(and(
      eq(folders.ownerId, userId),
      isNull(folders.trashedAt),
      fuzzyCondition
    ))
    .orderBy(sql`similarity(lower(${folders.name}), ${searchTerm}) DESC`)
    .limit(limit);

  return results;
}

export async function toggleStarred(
  userId: string,
  folderId: string
): Promise<Folder> {
  const folder = await getFolderById(userId, folderId);

  if (!folder) {
    throw new Error("NOT_FOUND");
  }

  const [updated] = await db
    .update(folders)
    .set({ isStarred: !folder.isStarred, updatedAt: new Date() })
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}

export async function listStarredFolders(
  userId: string
): Promise<Folder[]> {
  // Get all starred folders (no pagination for simplicity)
  const folderList = await db.query.folders.findMany({
    where: and(eq(folders.ownerId, userId), eq(folders.isStarred, true), isNull(folders.trashedAt)),
    orderBy: (folders, { desc }) => [desc(folders.updatedAt)],
  });

  return folderList;
}

export interface CopyFolderResult {
  folder: Folder;
  assetsCopied: number;
  foldersCopied: number;
}

export async function copyFolder(
  userId: string,
  folderId: string,
  targetParentId: string | null | undefined
): Promise<CopyFolderResult> {
  const folder = await getFolderById(userId, folderId);

  if (!folder) {
    throw new Error("NOT_FOUND");
  }

  // Prevent copying to self or its children
  if (targetParentId === folderId) {
    throw new Error("INVALID_COPY");
  }

  let parentPath: string | null = null;

  // Verify target parent folder exists if provided
  if (targetParentId) {
    const parent = await getFolderById(userId, targetParentId);
    if (!parent) {
      throw new Error("PARENT_NOT_FOUND");
    }

    // Prevent copying to a child of itself
    if (parent.path.startsWith(folder.path + "/")) {
      throw new Error("INVALID_COPY");
    }

    parentPath = parent.path;
  }

  // Generate a unique name for the copy
  let copyName = `${folder.name} (copy)`;
  const existingWithName = await db.query.folders.findFirst({
    where: and(
      eq(folders.ownerId, userId),
      eq(folders.name, copyName),
      targetParentId ? eq(folders.parentId, targetParentId) : isNull(folders.parentId)
    ),
  });

  if (existingWithName) {
    copyName = `${folder.name} (copy ${Date.now()})`;
  }

  const newPath = buildPath(parentPath, copyName);

  // Create the new folder
  const [newFolder] = await db
    .insert(folders)
    .values({
      name: copyName,
      parentId: targetParentId ?? null,
      ownerId: userId,
      path: newPath,
    })
    .returning();

  if (!newFolder) {
    throw new Error("INTERNAL_ERROR");
  }

  let assetsCopied = 0;
  let foldersCopied = 1; // Count the root folder

  // Copy all assets in this folder
  const folderAssets = await db.query.assets.findMany({
    where: and(eq(assets.folderId, folderId), eq(assets.ownerId, userId), isNull(assets.trashedAt)),
  });

  const storage = getStorage();

  for (const asset of folderAssets) {
    // Generate new storage key
    const newStorageKey = generateStorageKey(userId, asset.name, newFolder.id);

    // Copy the file in storage
    await storage.copyObject(asset.storageKey, newStorageKey);

    // Copy thumbnail if exists
    let newThumbnailKey: string | null = null;
    if (asset.thumbnailKey) {
      newThumbnailKey = generateStorageKey(userId, `thumb_${asset.name}`, newFolder.id);
      await storage.copyObject(asset.thumbnailKey, newThumbnailKey);
    }

    // Create new asset record
    await db.insert(assets).values({
      name: asset.name,
      originalName: asset.originalName,
      mimeType: asset.mimeType,
      size: asset.size,
      storageKey: newStorageKey,
      folderId: newFolder.id,
      ownerId: userId,
      thumbnailKey: newThumbnailKey,
    });

    assetsCopied++;
  }

  // Recursively copy subfolders
  const subfolders = await db.query.folders.findMany({
    where: and(eq(folders.parentId, folderId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
  });

  for (const subfolder of subfolders) {
    const result = await copyFolder(userId, subfolder.id, newFolder.id);
    assetsCopied += result.assetsCopied;
    foldersCopied += result.foldersCopied;
  }

  return {
    folder: newFolder,
    assetsCopied,
    foldersCopied,
  };
}
