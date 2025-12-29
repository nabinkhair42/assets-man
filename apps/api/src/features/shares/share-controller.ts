import type { Response, Request } from "express";
import { sendSuccess, sendError } from "@/utils/response-utils.js";
import * as shareService from "./share-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import {
  createUserShareSchema,
  createLinkShareSchema,
  updateShareSchema,
  accessLinkShareSchema,
} from "@/schema/share-schema.js";
import { createStorageClient, type StorageClient } from "@repo/storage";
import { getStorageConfig } from "@/config/env.js";

let storageClient: StorageClient | null = null;

function getStorage(): StorageClient {
  if (!storageClient) {
    storageClient = createStorageClient(getStorageConfig());
  }
  return storageClient;
}

// Create a user share
export async function createUserShare(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = createUserShareSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);
      return;
    }

    const share = await shareService.createUserShare(req.userId, parsed.data);
    sendSuccess(res, { share }, "Share created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "FOLDER_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }
    if (message === "ASSET_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }
    if (message === "SHARE_ALREADY_EXISTS") {
      sendError(res, "CONFLICT", "Share already exists for this user", 409);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to create share", 500);
  }
}

// Create a link share
export async function createLinkShare(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parsed = createLinkShareSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);
      return;
    }

    const share = await shareService.createLinkShare(req.userId, parsed.data);
    sendSuccess(res, { share }, "Link share created", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "FOLDER_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }
    if (message === "ASSET_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to create link share", 500);
  }
}

// Update a share
export async function updateShare(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Share ID is required", 400);
      return;
    }

    const parsed = updateShareSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid input", 400);
      return;
    }

    const share = await shareService.updateShare(req.userId, id, parsed.data);
    sendSuccess(res, { share }, "Share updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Share not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to update share", 500);
  }
}

// Delete a share
export async function deleteShare(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Share ID is required", 400);
      return;
    }

    await shareService.deleteShare(req.userId, id);
    sendSuccess(res, null, "Share deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Share not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to delete share", 500);
  }
}

// List shares for an item
export async function listSharesForItem(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { itemId, itemType } = req.params;
    if (!itemId || !itemType) {
      sendError(res, "VALIDATION_ERROR", "Item ID and type are required", 400);
      return;
    }

    if (itemType !== "folder" && itemType !== "asset") {
      sendError(res, "VALIDATION_ERROR", "Item type must be 'folder' or 'asset'", 400);
      return;
    }

    const shares = await shareService.listSharesForItem(req.userId, itemId, itemType);
    sendSuccess(res, { shares });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list shares", 500);
  }
}

// List all my shares
export async function listMyShares(req: AuthRequest, res: Response): Promise<void> {
  try {
    const shares = await shareService.listUserShares(req.userId);
    sendSuccess(res, { shares });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list shares", 500);
  }
}

// List shares shared with me
export async function listSharedWithMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const shares = await shareService.listSharedWithMe(req.userId);
    sendSuccess(res, { shares });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list shared items", 500);
  }
}

// Access a link share (public, no auth required)
export async function accessLinkShare(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    if (!token) {
      sendError(res, "VALIDATION_ERROR", "Share token is required", 400);
      return;
    }

    const share = await shareService.getShareByToken(token);
    if (!share) {
      sendError(res, "NOT_FOUND", "Share not found or expired", 404);
      return;
    }

    // Check if password is required
    if (share.linkPassword) {
      const parsed = accessLinkShareSchema.safeParse(req.body);
      const password = parsed.success ? parsed.data.password : undefined;

      if (!password) {
        sendError(res, "UNAUTHORIZED", "Password required", 401, { password: ["Password is required"] });
        return;
      }

      const isValid = await shareService.verifyLinkPassword(share.id, password);
      if (!isValid) {
        sendError(res, "UNAUTHORIZED", "Invalid password", 401);
        return;
      }
    }

    // Return share info (without sensitive data)
    sendSuccess(res, {
      share: {
        id: share.id,
        folderId: share.folderId,
        assetId: share.assetId,
        permission: share.permission,
        expiresAt: share.expiresAt,
      },
    });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to access share", 500);
  }
}

// Get share by ID
export async function getShare(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Share ID is required", 400);
      return;
    }

    const share = await shareService.getShareById(id);
    if (!share || share.ownerId !== req.userId) {
      sendError(res, "NOT_FOUND", "Share not found", 404);
      return;
    }

    sendSuccess(res, { share });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get share", 500);
  }
}

// Get share item details by token (public)
export async function getShareItemDetails(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    if (!token) {
      sendError(res, "VALIDATION_ERROR", "Share token is required", 400);
      return;
    }

    const share = await shareService.getShareWithItemByToken(token);
    if (!share) {
      sendError(res, "NOT_FOUND", "Share not found or expired", 404);
      return;
    }

    // Check if password is required
    const requiresPassword = !!share.linkPassword;

    // Build item info
    const item = share.folder
      ? {
          id: share.folder.id,
          name: share.folder.name,
          type: "folder" as const,
          createdAt: share.folder.createdAt,
        }
      : share.asset
        ? {
            id: share.asset.id,
            name: share.asset.name,
            type: "asset" as const,
            mimeType: share.asset.mimeType,
            size: share.asset.size,
            createdAt: share.asset.createdAt,
          }
        : null;

    if (!item) {
      sendError(res, "NOT_FOUND", "Shared item not found", 404);
      return;
    }

    sendSuccess(res, {
      share: {
        id: share.id,
        permission: share.permission,
        expiresAt: share.expiresAt,
        requiresPassword,
        ownerName: share.owner?.name ?? "Unknown",
      },
      item,
    });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get share details", 500);
  }
}

// Download shared asset (public, requires token and optional password)
export async function downloadSharedAsset(req: Request, res: Response): Promise<void> {
  try {
    const { token } = req.params;
    if (!token) {
      sendError(res, "VALIDATION_ERROR", "Share token is required", 400);
      return;
    }

    const share = await shareService.getShareWithItemByToken(token);
    if (!share) {
      sendError(res, "NOT_FOUND", "Share not found or expired", 404);
      return;
    }

    // Check password if required
    if (share.linkPassword) {
      const parsed = accessLinkShareSchema.safeParse(req.body);
      const password = parsed.success ? parsed.data.password : undefined;

      if (!password) {
        sendError(res, "UNAUTHORIZED", "Password required", 401);
        return;
      }

      const isValid = await shareService.verifyLinkPassword(share.id, password);
      if (!isValid) {
        sendError(res, "UNAUTHORIZED", "Invalid password", 401);
        return;
      }
    }

    if (!share.asset) {
      sendError(res, "VALIDATION_ERROR", "This share is not for an asset", 400);
      return;
    }

    // Generate download URL
    const storage = getStorage();
    const result = await storage.getPresignedDownloadUrl({
      key: share.asset.storageKey,
      expiresIn: 3600,
      filename: share.asset.name,
    });

    sendSuccess(res, { url: result.url, name: share.asset.name });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to download shared asset", 500);
  }
}
