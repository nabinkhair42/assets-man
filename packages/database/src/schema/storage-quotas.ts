import { pgTable, timestamp, uuid, bigint } from "drizzle-orm/pg-core";
import { users } from "./users";

// Default quota: 5GB in bytes
export const DEFAULT_STORAGE_QUOTA = 5 * 1024 * 1024 * 1024;

export const storageQuotas = pgTable("storage_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  quotaLimit: bigint("quota_limit", { mode: "number" })
    .notNull()
    .default(DEFAULT_STORAGE_QUOTA),
  usedStorage: bigint("used_storage", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type StorageQuota = typeof storageQuotas.$inferSelect;
export type NewStorageQuota = typeof storageQuotas.$inferInsert;
