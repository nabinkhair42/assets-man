import type { Response } from "express";
import archiver from "archiver";
import { sendSuccess, sendError, sendPaginated } from "@/utils/response-utils.js";
import * as assetService from "./asset-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import type {
  RequestUploadInput,
  UpdateAssetInput,
  ListAssetsQuery,
  CopyAssetInput,
  BulkDownloadInput,
} from "@/schema/asset-schema.js";
import { copyAssetSchema, bulkDownloadSchema } from "@/schema/asset-schema.js";

export async function requestUpload(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const input = req.body as RequestUploadInput;
    const result = await assetService.requestUpload(req.userId, input);
    sendSuccess(res, result, "Upload URL generated", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "FOLDER_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to generate upload URL", 500);
  }
}

export async function getAsset(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    const asset = await assetService.getAssetById(req.userId, id);

    if (!asset) {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    sendSuccess(res, { asset });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get asset", 500);
  }
}

export async function getDownloadUrl(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    const result = await assetService.getDownloadUrl(req.userId, id);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to generate download URL", 500);
  }
}

// Get download URL for shared asset (or owned asset)
export async function getSharedDownloadUrl(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    const result = await assetService.getSharedAssetDownloadUrl(req.userId, id);
    sendSuccess(res, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found or not shared with you", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to generate download URL", 500);
  }
}

export async function listAssets(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as unknown as ListAssetsQuery;
    const result = await assetService.listAssets(req.userId, query);
    sendPaginated(res, result.assets, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list assets", 500);
  }
}

export async function updateAsset(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    const input = req.body as UpdateAssetInput;
    const asset = await assetService.updateAsset(req.userId, id, input);
    sendSuccess(res, { asset }, "Asset updated");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    if (message === "FOLDER_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Destination folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to update asset", 500);
  }
}

export async function deleteAsset(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    await assetService.deleteAsset(req.userId, id);
    sendSuccess(res, null, "Asset deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to delete asset", 500);
  }
}

export async function toggleStarred(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    const asset = await assetService.toggleStarred(req.userId, id);
    sendSuccess(res, { asset }, asset.isStarred ? "Asset starred" : "Asset unstarred");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to toggle starred", 500);
  }
}

export async function listStarredAssets(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await assetService.listStarredAssets(req.userId, { page, limit });
    sendPaginated(res, result.assets, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list starred assets", 500);
  }
}

export async function copyAsset(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    const parsed = copyAssetSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", "Invalid input", 400);
      return;
    }

    const asset = await assetService.copyAsset(
      req.userId,
      id,
      parsed.data.targetFolderId
    );
    sendSuccess(res, { asset }, "Asset copied", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    if (message === "FOLDER_NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Destination folder not found", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to copy asset", 500);
  }
}

export async function bulkDownload(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parsed = bulkDownloadSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", "Invalid input", 400);
      return;
    }

    const { assetIds, folderIds } = parsed.data;

    // Get all assets to download
    const downloadAssets = await assetService.getBulkDownloadAssets(
      req.userId,
      assetIds,
      folderIds
    );

    if (downloadAssets.length === 0) {
      sendError(res, "NOT_FOUND", "No assets found to download", 404);
      return;
    }

    // Set response headers for ZIP download
    const filename = downloadAssets.length === 1
      ? downloadAssets[0]!.asset.name
      : `download-${Date.now()}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);

    // Create archive
    const archive = archiver("zip", { zlib: { level: 5 } });

    // Handle archive errors
    archive.on("error", (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) {
        sendError(res, "INTERNAL_ERROR", "Failed to create archive", 500);
      }
    });

    // Pipe archive to response
    archive.pipe(res);

    // Add files to archive
    const storage = assetService.getStorageForBulkDownload();

    for (const item of downloadAssets) {
      try {
        const stream = await storage.getObjectStream(item.asset.storageKey);
        archive.append(stream, { name: item.path });
      } catch (err) {
        console.error(`Failed to add ${item.path} to archive:`, err);
        // Continue with other files
      }
    }

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error("Bulk download error:", error);
    if (!res.headersSent) {
      sendError(res, "INTERNAL_ERROR", "Failed to create download", 500);
    }
  }
}
