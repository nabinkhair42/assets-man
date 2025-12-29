import { relations } from "drizzle-orm";
import { users } from "./users";
import { sessions } from "./sessions";
import { folders } from "./folders";
import { assets } from "./assets";
import { recentActivity } from "./recent-activity";
import { shares } from "./shares";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  folders: many(folders),
  assets: many(assets),
  recentActivity: many(recentActivity),
  sharesCreated: many(shares, { relationName: "owner" }),
  sharesReceived: many(shares, { relationName: "sharedWith" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  owner: one(users, {
    fields: [folders.ownerId],
    references: [users.id],
  }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "parentChild",
  }),
  children: many(folders, { relationName: "parentChild" }),
  assets: many(assets),
  recentActivity: many(recentActivity),
  shares: many(shares),
}));

export const assetsRelations = relations(assets, ({ one, many }) => ({
  owner: one(users, {
    fields: [assets.ownerId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [assets.folderId],
    references: [folders.id],
  }),
  recentActivity: many(recentActivity),
  shares: many(shares),
}));

export const recentActivityRelations = relations(recentActivity, ({ one }) => ({
  user: one(users, {
    fields: [recentActivity.userId],
    references: [users.id],
  }),
  asset: one(assets, {
    fields: [recentActivity.assetId],
    references: [assets.id],
  }),
  folder: one(folders, {
    fields: [recentActivity.folderId],
    references: [folders.id],
  }),
}));

export const sharesRelations = relations(shares, ({ one }) => ({
  owner: one(users, {
    fields: [shares.ownerId],
    references: [users.id],
    relationName: "owner",
  }),
  sharedWithUser: one(users, {
    fields: [shares.sharedWithUserId],
    references: [users.id],
    relationName: "sharedWith",
  }),
  folder: one(folders, {
    fields: [shares.folderId],
    references: [folders.id],
  }),
  asset: one(assets, {
    fields: [shares.assetId],
    references: [assets.id],
  }),
}));
