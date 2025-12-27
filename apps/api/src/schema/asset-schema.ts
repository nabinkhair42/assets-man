import { z } from "zod";

export const requestUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required").max(255),
  mimeType: z.string().min(1, "MIME type is required"),
  size: z.number().positive("Size must be positive"),
  folderId: z.string().uuid().optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).optional(),
  folderId: z.string().uuid().nullable().optional(),
});

export const assetIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listAssetsQuerySchema = z.object({
  folderId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.coerce.number().positive().default(1),
  limit: z.coerce.number().positive().max(100).default(20),
});

export type RequestUploadInput = z.infer<typeof requestUploadSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type ListAssetsQuery = z.infer<typeof listAssetsQuerySchema>;
