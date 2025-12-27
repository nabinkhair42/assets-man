import { eq, and, isNull, isNotNull, count } from "drizzle-orm";
import { createDb, folders, type Folder } from "@repo/database";
import { config } from "@/config/env.js";
import type {
  CreateFolderInput,
  UpdateFolderInput,
  MoveFolderInput,
} from "@/schema/folder-schema.js";

const db = createDb(config.DATABASE_URL);

export interface FolderWithChildren extends Folder {
  children?: FolderWithChildren[];
}

function buildPath(parentPath: string | null, name: string): string {
  return parentPath ? `${parentPath}/${name}` : `/${name}`;
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

export async function getFolderContents(
  userId: string,
  parentId: string | null
): Promise<Folder[]> {
  if (parentId) {
    return db.query.folders.findMany({
      where: and(eq(folders.parentId, parentId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
      orderBy: (folders, { asc }) => [asc(folders.name)],
    });
  }

  // Root level folders - exclude trashed
  return db.query.folders.findMany({
    where: and(isNull(folders.parentId), eq(folders.ownerId, userId), isNull(folders.trashedAt)),
    orderBy: (folders, { asc }) => [asc(folders.name)],
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

  if (input.name && input.name !== existing.name) {
    updates.name = input.name;
    // Update path
    const parentPath = existing.parentId
      ? existing.path.substring(0, existing.path.lastIndexOf("/"))
      : null;
    updates.path = buildPath(parentPath, input.name);
  }

  const [updated] = await db
    .update(folders)
    .set(updates)
    .where(and(eq(folders.id, folderId), eq(folders.ownerId, userId)))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  // TODO: Update child paths if name changed

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

  // TODO: Update child paths

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
