import type { Response } from "express";
import { sendSuccess, sendError } from "@/utils/response-utils.js";
import * as recentService from "./recent-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import {
  recordAccessSchema,
  listRecentQuerySchema,
} from "@/schema/recent-schema.js";

export async function recordAccess(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parsed = recordAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", "Invalid input", 400);
      return;
    }

    await recentService.recordAccess(req.userId, parsed.data);
    sendSuccess(res, null, "Access recorded");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "ASSET_NOT_FOUND" || message === "FOLDER_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Item not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to record access", 500);
  }
}

export async function listRecentItems(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parsed = listRecentQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", "Invalid query parameters", 400);
      return;
    }

    const result = await recentService.listRecentItems(req.userId, parsed.data);

    // Return in paginated format
    res.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list recent items", 500);
  }
}

export async function clearRecentHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const count = await recentService.clearRecentHistory(req.userId);
    sendSuccess(res, { deletedCount: count }, "Recent history cleared");
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to clear recent history", 500);
  }
}

export async function removeFromRecent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { itemType } = req.query;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Item ID is required", 400);
      return;
    }

    if (itemType !== "asset" && itemType !== "folder") {
      sendError(res, "VALIDATION_ERROR", "Invalid item type", 400);
      return;
    }

    await recentService.removeFromRecent(req.userId, id, itemType);
    sendSuccess(res, null, "Removed from recent");
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to remove from recent", 500);
  }
}
