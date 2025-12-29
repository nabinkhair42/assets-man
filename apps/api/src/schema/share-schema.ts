import { z } from "zod";

export const sharePermissionSchema = z.enum(["view", "edit"]);
export const shareTypeSchema = z.enum(["user", "link"]);

// Create a share with a user (by email)
export const createUserShareSchema = z.object({
  folderId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  email: z.string().email("Valid email is required"),
  permission: sharePermissionSchema.default("view"),
}).refine(
  (data) => (data.folderId && !data.assetId) || (!data.folderId && data.assetId),
  { message: "Exactly one of folderId or assetId must be provided" }
);

// Create a public link share
export const createLinkShareSchema = z.object({
  folderId: z.string().uuid().optional(),
  assetId: z.string().uuid().optional(),
  permission: sharePermissionSchema.default("view"),
  password: z.string().min(4).optional(),
  expiresIn: z.number().positive().optional(), // Hours until expiration
}).refine(
  (data) => (data.folderId && !data.assetId) || (!data.folderId && data.assetId),
  { message: "Exactly one of folderId or assetId must be provided" }
);

// Update share
export const updateShareSchema = z.object({
  permission: sharePermissionSchema.optional(),
  password: z.string().min(4).nullable().optional(), // null to remove password
  expiresIn: z.number().positive().nullable().optional(), // null to remove expiration
});

// Share ID param
export const shareIdParamSchema = z.object({
  id: z.string().uuid(),
});

// Access link share (with optional password)
export const accessLinkShareSchema = z.object({
  password: z.string().optional(),
});

export type SharePermission = z.infer<typeof sharePermissionSchema>;
export type ShareType = z.infer<typeof shareTypeSchema>;
export type CreateUserShareInput = z.infer<typeof createUserShareSchema>;
export type CreateLinkShareInput = z.infer<typeof createLinkShareSchema>;
export type UpdateShareInput = z.infer<typeof updateShareSchema>;
export type AccessLinkShareInput = z.infer<typeof accessLinkShareSchema>;
