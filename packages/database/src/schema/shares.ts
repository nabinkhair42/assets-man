import { pgTable, text, timestamp, uuid, pgEnum, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { folders } from "./folders";
import { assets } from "./assets";

// Share permission levels
export const sharePermissionEnum = pgEnum("share_permission", ["view", "edit"]);

// Share type - whether it's shared with a specific user or a public link
export const shareTypeEnum = pgEnum("share_type", ["user", "link"]);

// Shared items table - tracks individual shares
export const shares = pgTable(
  "shares",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    // The owner who created the share
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    // What is being shared (either folder or asset, but not both)
    folderId: uuid("folder_id").references(() => folders.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id").references(() => assets.id, { onDelete: "cascade" }),

    // Share type
    shareType: shareTypeEnum("share_type").notNull(),

    // For user shares - the user who has access
    sharedWithUserId: uuid("shared_with_user_id").references(() => users.id, { onDelete: "cascade" }),
    // For user shares - the email (used for invitations before user accepts)
    sharedWithEmail: text("shared_with_email"),

    // Permission level
    permission: sharePermissionEnum("permission").notNull().default("view"),

    // For link shares - the unique token
    linkToken: text("link_token").unique(),
    // For link shares - optional password (hashed)
    linkPassword: text("link_password"),

    // Optional expiration
    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idx_shares_asset_user").on(table.assetId, table.sharedWithUserId),
    index("idx_shares_folder_user").on(table.folderId, table.sharedWithUserId),
    index("idx_shares_owner_type").on(table.ownerId, table.shareType),
    index("idx_shares_owner_created").on(table.ownerId, table.createdAt),
  ]
);

export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;
export type SharePermission = "view" | "edit";
export type ShareType = "user" | "link";
