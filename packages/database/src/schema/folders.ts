import { pgTable, text, timestamp, uuid, boolean, index, type AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./users";

export const folders = pgTable(
  "folders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    parentId: uuid("parent_id").references((): AnyPgColumn => folders.id, {
      onDelete: "cascade",
    }),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    path: text("path").notNull(), // Materialized path: /root/folder1/folder2
    isStarred: boolean("is_starred").default(false).notNull(),
    trashedAt: timestamp("trashed_at"), // Null = not trashed, timestamp = trashed
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_folders_owner_parent").on(table.ownerId, table.parentId),
    index("idx_folders_owner_trashed").on(table.ownerId, table.trashedAt),
  ]
);

export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
