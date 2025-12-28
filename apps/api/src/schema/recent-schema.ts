import { z } from "zod";

export const recordAccessSchema = z.object({
  itemId: z.string().uuid(),
  itemType: z.enum(["asset", "folder"]),
});

export const listRecentQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(50).default(20),
});

export type RecordAccessInput = z.infer<typeof recordAccessSchema>;
export type ListRecentQuery = z.infer<typeof listRecentQuerySchema>;
