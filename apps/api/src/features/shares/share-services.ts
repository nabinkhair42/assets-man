import { eq, and, or, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createDb, shares, assets, folders, users, type Share } from "@repo/database";
import { config } from "@/config/env.js";
import type {
  CreateUserShareInput,
  CreateLinkShareInput,
  UpdateShareInput,
  SharePermission,
} from "@/schema/share-schema.js";

const db = createDb(config.DATABASE_URL);

export interface ShareWithDetails {
  id: string;
  ownerId: string;
  folderId: string | null;
  assetId: string | null;
  shareType: "user" | "link";
  sharedWithUserId: string | null;
  sharedWithEmail: string | null;
  permission: "view" | "edit";
  linkToken: string | null;
  linkPassword: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sharedWithName: string | null;
  ownerName: string | null;
  itemName: string;
  itemType: "folder" | "asset";
  // Asset details
  mimeType: string | null;
  size: number | null;
}

// Generate a unique link token
function generateLinkToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Hash password for link shares
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Verify password for link shares
export async function verifyLinkPassword(shareId: string, password: string): Promise<boolean> {
  const share = await db.query.shares.findFirst({
    where: eq(shares.id, shareId),
  });

  if (!share || !share.linkPassword) return false;
  return bcrypt.compare(password, share.linkPassword);
}

// Create a user share
export async function createUserShare(
  ownerId: string,
  input: CreateUserShareInput
): Promise<Share> {
  const { folderId, assetId, email, permission } = input;

  // Verify the item exists and is owned by the user
  if (folderId) {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, folderId), eq(folders.ownerId, ownerId)),
    });
    if (!folder) throw new Error("FOLDER_NOT_FOUND");
  } else if (assetId) {
    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, assetId), eq(assets.ownerId, ownerId)),
    });
    if (!asset) throw new Error("ASSET_NOT_FOUND");
  }

  // Check if user exists with this email
  const sharedWithUser = await db.query.users.findFirst({
    where: eq(users.email, email.toLowerCase()),
  });

  // Check for existing share
  const existingShare = await db.query.shares.findFirst({
    where: and(
      eq(shares.ownerId, ownerId),
      eq(shares.shareType, "user"),
      folderId ? eq(shares.folderId, folderId) : isNull(shares.folderId),
      assetId ? eq(shares.assetId, assetId) : isNull(shares.assetId),
      or(
        sharedWithUser ? eq(shares.sharedWithUserId, sharedWithUser.id) : undefined,
        eq(shares.sharedWithEmail, email.toLowerCase())
      )
    ),
  });

  if (existingShare) {
    throw new Error("SHARE_ALREADY_EXISTS");
  }

  const [share] = await db
    .insert(shares)
    .values({
      ownerId,
      folderId: folderId ?? null,
      assetId: assetId ?? null,
      shareType: "user",
      sharedWithUserId: sharedWithUser?.id ?? null,
      sharedWithEmail: email.toLowerCase(),
      permission,
    })
    .returning();

  if (!share) throw new Error("INTERNAL_ERROR");
  return share;
}

// Create a link share
export async function createLinkShare(
  ownerId: string,
  input: CreateLinkShareInput
): Promise<Share> {
  const { folderId, assetId, permission, password, expiresIn } = input;

  // Verify the item exists and is owned by the user
  if (folderId) {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, folderId), eq(folders.ownerId, ownerId)),
    });
    if (!folder) throw new Error("FOLDER_NOT_FOUND");
  } else if (assetId) {
    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, assetId), eq(assets.ownerId, ownerId)),
    });
    if (!asset) throw new Error("ASSET_NOT_FOUND");
  }

  const linkToken = generateLinkToken();
  const linkPassword = password ? await hashPassword(password) : null;
  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 60 * 60 * 1000) : null;

  const [share] = await db
    .insert(shares)
    .values({
      ownerId,
      folderId: folderId ?? null,
      assetId: assetId ?? null,
      shareType: "link",
      permission,
      linkToken,
      linkPassword,
      expiresAt,
    })
    .returning();

  if (!share) throw new Error("INTERNAL_ERROR");
  return share;
}

// Update a share
export async function updateShare(
  ownerId: string,
  shareId: string,
  input: UpdateShareInput
): Promise<Share> {
  const share = await db.query.shares.findFirst({
    where: and(eq(shares.id, shareId), eq(shares.ownerId, ownerId)),
  });

  if (!share) throw new Error("NOT_FOUND");

  const updates: Partial<Share> = { updatedAt: new Date() };

  if (input.permission !== undefined) {
    updates.permission = input.permission as SharePermission;
  }

  if (input.password !== undefined) {
    updates.linkPassword = input.password ? await hashPassword(input.password) : null;
  }

  if (input.expiresIn !== undefined) {
    updates.expiresAt = input.expiresIn ? new Date(Date.now() + input.expiresIn * 60 * 60 * 1000) : null;
  }

  const [updated] = await db
    .update(shares)
    .set(updates)
    .where(and(eq(shares.id, shareId), eq(shares.ownerId, ownerId)))
    .returning();

  if (!updated) throw new Error("INTERNAL_ERROR");
  return updated;
}

// Delete a share
export async function deleteShare(ownerId: string, shareId: string): Promise<void> {
  const share = await db.query.shares.findFirst({
    where: and(eq(shares.id, shareId), eq(shares.ownerId, ownerId)),
  });

  if (!share) throw new Error("NOT_FOUND");

  await db.delete(shares).where(eq(shares.id, shareId));
}

// List shares for an item (folder or asset)
export async function listSharesForItem(
  ownerId: string,
  itemId: string,
  itemType: "folder" | "asset"
): Promise<ShareWithDetails[]> {
  const shareList = await db.query.shares.findMany({
    where: and(
      eq(shares.ownerId, ownerId),
      itemType === "folder" ? eq(shares.folderId, itemId) : eq(shares.assetId, itemId)
    ),
    with: {
      sharedWithUser: true,
      folder: true,
      asset: true,
    },
  });

  return shareList.map((share) => ({
    ...share,
    sharedWithName: share.sharedWithUser?.name ?? null,
    ownerName: null,
    itemName: share.folder?.name ?? share.asset?.name ?? "Unknown",
    itemType: share.folderId ? "folder" : "asset",
    mimeType: share.asset?.mimeType ?? null,
    size: share.asset?.size ?? null,
  }));
}

// List all shares created by a user
export async function listUserShares(ownerId: string): Promise<ShareWithDetails[]> {
  const shareList = await db.query.shares.findMany({
    where: eq(shares.ownerId, ownerId),
    with: {
      sharedWithUser: true,
      folder: true,
      asset: true,
    },
    orderBy: (shares, { desc }) => [desc(shares.createdAt)],
  });

  return shareList.map((share) => ({
    ...share,
    sharedWithName: share.sharedWithUser?.name ?? null,
    ownerName: null,
    itemName: share.folder?.name ?? share.asset?.name ?? "Unknown",
    itemType: share.folderId ? "folder" : "asset",
    mimeType: share.asset?.mimeType ?? null,
    size: share.asset?.size ?? null,
  }));
}

// List shares shared with a user
export async function listSharedWithMe(userId: string): Promise<ShareWithDetails[]> {
  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) throw new Error("USER_NOT_FOUND");

  const shareList = await db.query.shares.findMany({
    where: and(
      eq(shares.shareType, "user"),
      or(
        eq(shares.sharedWithUserId, userId),
        eq(shares.sharedWithEmail, user.email)
      )
    ),
    with: {
      owner: true,
      folder: true,
      asset: true,
    },
    orderBy: (shares, { desc }) => [desc(shares.createdAt)],
  });

  return shareList.map((share) => ({
    ...share,
    sharedWithName: user.name,
    ownerName: share.owner?.name ?? null,
    itemName: share.folder?.name ?? share.asset?.name ?? "Unknown",
    itemType: share.folderId ? "folder" : "asset",
    mimeType: share.asset?.mimeType ?? null,
    size: share.asset?.size ?? null,
  }));
}

// Get share by link token
export async function getShareByToken(token: string): Promise<Share | null> {
  const share = await db.query.shares.findFirst({
    where: and(
      eq(shares.linkToken, token),
      eq(shares.shareType, "link")
    ),
  });

  if (!share) return null;

  // Check if expired
  if (share.expiresAt && new Date() > share.expiresAt) {
    return null;
  }

  return share;
}

// Get share by ID
export async function getShareById(shareId: string): Promise<Share | null> {
  const share = await db.query.shares.findFirst({
    where: eq(shares.id, shareId),
  });
  return share ?? null;
}

// Get share with item details by token
export async function getShareWithItemByToken(token: string) {
  const share = await db.query.shares.findFirst({
    where: and(
      eq(shares.linkToken, token),
      eq(shares.shareType, "link")
    ),
    with: {
      folder: true,
      asset: true,
      owner: {
        columns: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!share) return null;

  // Check if expired
  if (share.expiresAt && new Date() > share.expiresAt) {
    return null;
  }

  return share;
}

// Check if user has access to an item through shares
export async function checkShareAccess(
  userId: string | null,
  itemId: string,
  itemType: "folder" | "asset",
  requiredPermission: SharePermission = "view"
): Promise<boolean> {
  if (!userId) return false;

  // Get user email
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return false;

  // Check for user share
  const share = await db.query.shares.findFirst({
    where: and(
      eq(shares.shareType, "user"),
      itemType === "folder" ? eq(shares.folderId, itemId) : eq(shares.assetId, itemId),
      or(
        eq(shares.sharedWithUserId, userId),
        eq(shares.sharedWithEmail, user.email)
      )
    ),
  });

  if (!share) return false;

  // Check permission level
  if (requiredPermission === "edit" && share.permission !== "edit") {
    return false;
  }

  return true;
}
