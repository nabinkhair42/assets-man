import { z } from "zod";

export const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  parentId: z.string().uuid().optional(),
});

export const updateFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
});

export const moveFolderSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

export const folderIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
