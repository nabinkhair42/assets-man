import { eq, sum } from "drizzle-orm";
import {
  createDb,
  storageQuotas,
  assets,
  DEFAULT_STORAGE_QUOTA,
  type StorageQuota,
} from "@repo/database";
import { config } from "@/config/env.js";

const db = createDb(config.DATABASE_URL);

export interface StorageStats {
  usedStorage: number;
  quotaLimit: number;
  usedPercentage: number;
  remainingStorage: number;
  formattedUsed: string;
  formattedLimit: string;
  formattedRemaining: string;
}

// Format bytes to human readable string
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Get or create storage quota for a user
export async function getOrCreateStorageQuota(
  userId: string
): Promise<StorageQuota> {
  // Try to find existing quota
  const existing = await db.query.storageQuotas.findFirst({
    where: eq(storageQuotas.userId, userId),
  });

  if (existing) {
    return existing;
  }

  // Create new quota with defaults
  const [quota] = await db
    .insert(storageQuotas)
    .values({
      userId,
      quotaLimit: DEFAULT_STORAGE_QUOTA,
      usedStorage: 0,
    })
    .returning();

  if (!quota) {
    throw new Error("INTERNAL_ERROR");
  }

  return quota;
}

// Get storage statistics for a user
export async function getStorageStats(userId: string): Promise<StorageStats> {
  const quota = await getOrCreateStorageQuota(userId);

  const usedPercentage =
    quota.quotaLimit > 0
      ? Math.min(100, (quota.usedStorage / quota.quotaLimit) * 100)
      : 0;

  const remainingStorage = Math.max(0, quota.quotaLimit - quota.usedStorage);

  return {
    usedStorage: quota.usedStorage,
    quotaLimit: quota.quotaLimit,
    usedPercentage: Math.round(usedPercentage * 100) / 100,
    remainingStorage,
    formattedUsed: formatBytes(quota.usedStorage),
    formattedLimit: formatBytes(quota.quotaLimit),
    formattedRemaining: formatBytes(remainingStorage),
  };
}

// Check if user has enough quota for a file
export async function checkQuotaAvailable(
  userId: string,
  fileSize: number
): Promise<{ available: boolean; required: number; remaining: number }> {
  const quota = await getOrCreateStorageQuota(userId);
  const remaining = quota.quotaLimit - quota.usedStorage;
  const available = remaining >= fileSize;

  return {
    available,
    required: fileSize,
    remaining,
  };
}

// Increment used storage after successful upload
export async function incrementUsedStorage(
  userId: string,
  bytes: number
): Promise<StorageQuota> {
  const quota = await getOrCreateStorageQuota(userId);

  const [updated] = await db
    .update(storageQuotas)
    .set({
      usedStorage: quota.usedStorage + bytes,
      updatedAt: new Date(),
    })
    .where(eq(storageQuotas.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}

// Decrement used storage after permanent delete
export async function decrementUsedStorage(
  userId: string,
  bytes: number
): Promise<StorageQuota> {
  const quota = await getOrCreateStorageQuota(userId);

  const newUsed = Math.max(0, quota.usedStorage - bytes);

  const [updated] = await db
    .update(storageQuotas)
    .set({
      usedStorage: newUsed,
      updatedAt: new Date(),
    })
    .where(eq(storageQuotas.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}

// Recalculate storage from actual assets (for fixing inconsistencies)
export async function recalculateStorage(userId: string): Promise<StorageQuota> {
  // Sum all asset sizes for the user (excluding trashed)
  const [result] = await db
    .select({
      totalSize: sum(assets.size),
    })
    .from(assets)
    .where(eq(assets.ownerId, userId));

  const actualUsed = Number(result?.totalSize) || 0;

  // Update the quota record
  const quota = await getOrCreateStorageQuota(userId);

  const [updated] = await db
    .update(storageQuotas)
    .set({
      usedStorage: actualUsed,
      updatedAt: new Date(),
    })
    .where(eq(storageQuotas.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}

// Update quota limit (admin function)
export async function updateQuotaLimit(
  userId: string,
  newLimit: number
): Promise<StorageQuota> {
  const quota = await getOrCreateStorageQuota(userId);

  const [updated] = await db
    .update(storageQuotas)
    .set({
      quotaLimit: newLimit,
      updatedAt: new Date(),
    })
    .where(eq(storageQuotas.userId, userId))
    .returning();

  if (!updated) {
    throw new Error("INTERNAL_ERROR");
  }

  return updated;
}
