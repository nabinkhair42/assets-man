import { z } from "zod";

export const trashItemIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const trashItemTypeParamSchema = z.object({
  type: z.enum(["asset", "folder"]),
});

export const listTrashQuerySchema = z.object({
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

export type TrashItemIdParam = z.infer<typeof trashItemIdParamSchema>;
export type TrashItemTypeParam = z.infer<typeof trashItemTypeParamSchema>;
export type ListTrashQuery = z.infer<typeof listTrashQuerySchema>;
