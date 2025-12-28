import { pgTable, uuid, timestamp, text, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { assets } from "./assets";
import { folders } from "./folders";

export const recentActivity = pgTable(
  "recent_activity",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Either assetId or folderId will be set, not both
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }),
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull().$type<"asset" | "folder">(),
    accessedAt: timestamp("accessed_at").defaultNow().notNull(),
  },
  (table) => [
    // Index for fast lookup by user and recent access
    index("idx_recent_activity_user_accessed").on(table.userId, table.accessedAt),
    // Unique constraint: one entry per user per item
    index("idx_recent_activity_user_asset").on(table.userId, table.assetId),
    index("idx_recent_activity_user_folder").on(table.userId, table.folderId),
  ]
);

export type RecentActivity = typeof recentActivity.$inferSelect;
export type NewRecentActivity = typeof recentActivity.$inferInsert;
