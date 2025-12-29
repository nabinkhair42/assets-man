import { z } from "zod";

export const folderSortBySchema = z.enum(["name", "createdAt", "updatedAt"]);
export const sortOrderSchema = z.enum(["asc", "desc"]);

export const folderContentsQuerySchema = z.object({
  parentId: z.string().uuid().optional(),
  sortBy: folderSortBySchema.default("name"),
  sortOrder: sortOrderSchema.default("asc"),
});

export const createFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  parentId: z.string().uuid().optional(),
});

export type FolderContentsQuery = z.infer<typeof folderContentsQuerySchema>;

export const updateFolderSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
});

export const moveFolderSchema = z.object({
  parentId: z.string().uuid().nullable(),
});

export const folderIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const folderSearchQuerySchema = z.object({
  q: z.string().min(1, "Search query is required"),
  limit: z.coerce.number().positive().max(50).default(10),
});

export const copyFolderSchema = z.object({
  targetParentId: z.string().uuid().nullable().optional(), // null = root folder
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type MoveFolderInput = z.infer<typeof moveFolderSchema>;
export type FolderSearchQuery = z.infer<typeof folderSearchQuerySchema>;
export type CopyFolderInput = z.infer<typeof copyFolderSchema>;
