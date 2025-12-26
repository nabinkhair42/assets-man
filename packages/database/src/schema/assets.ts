import { pgTable, text, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { folders } from "./folders.js";

export const assets = pgTable("assets", {
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
