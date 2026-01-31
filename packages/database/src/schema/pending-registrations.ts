import { pgTable, text, timestamp, uuid, integer } from "drizzle-orm/pg-core";

export const pendingRegistrations = pgTable("pending_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  otp: text("otp").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PendingRegistration = typeof pendingRegistrations.$inferSelect;
export type NewPendingRegistration = typeof pendingRegistrations.$inferInsert;
