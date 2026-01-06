import type { Response, NextFunction } from "express";
import { checkQuotaAvailable } from "@/features/storage/storage-services.js";
import { ErrorResponses } from "@/utils/response-utils.js";
import type { AuthRequest } from "./auth-middleware.js";

// Middleware to check storage quota before upload
export async function checkStorageQuota(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get file size from request body
    const fileSize = req.body?.size;

    if (!fileSize || typeof fileSize !== "number" || fileSize <= 0) {
      // If no size provided, let the route handler deal with validation
      next();
      return;
    }

    const quotaCheck = await checkQuotaAvailable(req.userId, fileSize);

    if (!quotaCheck.available) {
      const formattedRemaining = formatBytes(quotaCheck.remaining);
      const formattedRequired = formatBytes(quotaCheck.required);

      res.status(413).json({
        success: false,
        error: {
          code: "QUOTA_EXCEEDED",
          message: `Insufficient storage quota. Required: ${formattedRequired}, Available: ${formattedRemaining}`,
          details: {
            required: quotaCheck.required,
            remaining: quotaCheck.remaining,
          },
        },
      });
      return;
    }

    next();
  } catch (error) {
    // If quota check fails, log but don't block upload
    console.error("Storage quota check failed:", error);
    next();
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
