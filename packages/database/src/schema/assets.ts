import { pgTable, text, timestamp, uuid, bigint, boolean, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { folders } from "./folders";

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: bigint("size", { mode: "number" }).notNull(),
    storageKey: text("storage_key").notNull(), // S3/GCS object key
    folderId: uuid("folder_id").references(() => folders.id, {
      onDelete: "set null",
    }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    thumbnailKey: text("thumbnail_key"), // For image/video previews
    isStarred: boolean("is_starred").default(false).notNull(),
    trashedAt: timestamp("trashed_at"), // Null = not trashed, timestamp = trashed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_assets_owner_folder").on(table.ownerId, table.folderId),
    index("idx_assets_owner_trashed").on(table.ownerId, table.trashedAt),
    index("idx_assets_owner_starred").on(table.ownerId, table.isStarred),
  ]
);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
