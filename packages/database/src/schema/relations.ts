import { relations } from "drizzle-orm";
import { users } from "./users";
import { sessions } from "./sessions";
import { folders } from "./folders";
import { assets } from "./assets";

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  folders: many(folders),
  assets: many(assets),
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
}));

export const assetsRelations = relations(assets, ({ one }) => ({
  owner: one(users, {
    fields: [assets.ownerId],
    references: [users.id],
  }),
  folder: one(folders, {
    fields: [assets.folderId],
    references: [folders.id],
  }),
}));
