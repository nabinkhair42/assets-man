import type { Response } from "express";
import { sendSuccess, sendError } from "@/utils/response-utils.js";
import * as storageService from "./storage-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";

// Get storage statistics for current user
export async function getStorageStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const stats = await storageService.getStorageStats(req.userId);
    sendSuccess(res, { stats }, "Storage statistics retrieved");
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get storage statistics", 500);
  }
}

// Recalculate storage from actual assets
export async function recalculateStorage(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    await storageService.recalculateStorage(req.userId);
    const stats = await storageService.getStorageStats(req.userId);
    sendSuccess(res, { stats }, "Storage recalculated successfully");
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to recalculate storage", 500);
  }
}
