import { eq, and, desc, count, isNull } from "drizzle-orm";
import { createDb, recentActivity, assets, folders, type Asset, type Folder } from "@repo/database";
import { config } from "@/config/env.js";
import type { RecordAccessInput, ListRecentQuery } from "@/schema/recent-schema.js";

const db = createDb(config.DATABASE_URL);

export interface RecentItem {
  id: string;
  itemType: "asset" | "folder";
  accessedAt: string;
  asset?: Asset;
  folder?: Folder;
}

export interface PaginatedRecentItems {
  items: RecentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function recordAccess(
  userId: string,
  input: RecordAccessInput
): Promise<void> {
  const { itemId, itemType } = input;

  // Verify the item exists and belongs to the user
  if (itemType === "asset") {
    const asset = await db.query.assets.findFirst({
      where: and(eq(assets.id, itemId), eq(assets.ownerId, userId)),
    });
    if (!asset) {
      throw new Error("ASSET_NOT_FOUND");
    }
  } else {
    const folder = await db.query.folders.findFirst({
      where: and(eq(folders.id, itemId), eq(folders.ownerId, userId)),
    });
    if (!folder) {
      throw new Error("FOLDER_NOT_FOUND");
    }
  }

  // Check if entry already exists
  const existingEntry = await db.query.recentActivity.findFirst({
    where: and(
      eq(recentActivity.userId, userId),
      itemType === "asset"
        ? eq(recentActivity.assetId, itemId)
        : eq(recentActivity.folderId, itemId)
    ),
  });

  if (existingEntry) {
    // Update the access timestamp
    await db
      .update(recentActivity)
      .set({ accessedAt: new Date() })
      .where(eq(recentActivity.id, existingEntry.id));
  } else {
    // Insert new entry
    await db.insert(recentActivity).values({
      userId,
      assetId: itemType === "asset" ? itemId : null,
      folderId: itemType === "folder" ? itemId : null,
      itemType,
    });
  }

  // Optionally: Limit recent items to last 100 per user
  // This prevents the table from growing indefinitely
  const recentCount = await db
    .select({ count: count() })
    .from(recentActivity)
    .where(eq(recentActivity.userId, userId));

  if ((recentCount[0]?.count ?? 0) > 100) {
    // Delete oldest entries beyond 100
    const oldestToKeep = await db.query.recentActivity.findMany({
      where: eq(recentActivity.userId, userId),
      orderBy: desc(recentActivity.accessedAt),
      limit: 100,
      offset: 0,
    });

    if (oldestToKeep.length === 100) {
      const cutoffDate = oldestToKeep[99]?.accessedAt;
      if (cutoffDate) {
        await db
          .delete(recentActivity)
          .where(
            and(
              eq(recentActivity.userId, userId),
              // Delete entries older than the 100th most recent
              eq(recentActivity.accessedAt, cutoffDate)
            )
          );
      }
    }
  }
}

export async function listRecentItems(
  userId: string,
  query: ListRecentQuery
): Promise<PaginatedRecentItems> {
  const { page, limit } = query;
  const offset = (page - 1) * limit;

  // Get total count and recent items in parallel
  const [countResults, recentItems] = await Promise.all([
    db
      .select({ count: count() })
      .from(recentActivity)
      .where(eq(recentActivity.userId, userId)),
    db.query.recentActivity.findMany({
      where: eq(recentActivity.userId, userId),
      orderBy: desc(recentActivity.accessedAt),
      limit,
      offset,
      with: {
        asset: true,
        folder: true,
      },
    }),
  ]);

  const total = countResults[0]?.count ?? 0;

  // Filter out items that have been deleted or trashed
  const validItems: RecentItem[] = recentItems.flatMap((item) => {
    const isValid =
      item.itemType === "asset"
        ? item.asset && !item.asset.trashedAt
        : item.folder && !item.folder.trashedAt;
    if (!isValid) return [];
    return [
      {
        id: item.id,
        itemType: item.itemType as "asset" | "folder",
        accessedAt: item.accessedAt.toISOString(),
        asset: item.asset ?? undefined,
        folder: item.folder ?? undefined,
      },
    ];
  });

  return {
    items: validItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function clearRecentHistory(userId: string): Promise<number> {
  const result = await db
    .delete(recentActivity)
    .where(eq(recentActivity.userId, userId))
    .returning();

  return result.length;
}

export async function removeFromRecent(
  userId: string,
  itemId: string,
  itemType: "asset" | "folder"
): Promise<void> {
  await db
    .delete(recentActivity)
    .where(
      and(
        eq(recentActivity.userId, userId),
        itemType === "asset"
          ? eq(recentActivity.assetId, itemId)
          : eq(recentActivity.folderId, itemId)
      )
    );
}
