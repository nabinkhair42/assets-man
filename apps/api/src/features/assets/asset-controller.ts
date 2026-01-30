import type { Readable } from "stream";
import type { Response } from "express";
import archiver from "archiver";
import { sendSuccess, sendError, sendPaginated } from "@/utils/response-utils.js";

// Concurrency-limited Promise.allSettled
async function allSettledWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const i = index++;
      try {
        results[i] = { status: "fulfilled", value: await tasks[i]!() };
      } catch (reason) {
        results[i] = { status: "rejected", reason };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, () => runNext()));
  return results;
}
import * as assetService from "./asset-services.js";
import * as thumbnailService from "./thumbnail-service.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import { copyAssetSchema, bulkDownloadSchema, batchThumbnailUrlsSchema, type ListAssetsQuery, type RequestUploadInput, type UpdateAssetInput } from "@/schema/asset-schema.js";

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

    if (message === "QUOTA_EXCEEDED") {
      sendError(res, "QUOTA_EXCEEDED", "Insufficient storage quota to copy this file", 413);
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

    // Fetch streams with limited concurrency, then append sequentially to archive
    const storage = assetService.getStorageForBulkDownload();

    const streamResults = await allSettledWithConcurrency(
      downloadAssets.map((item) => async () => ({
        stream: await storage.getObjectStream(item.asset.storageKey) as Readable,
        path: item.path,
      })),
      5
    );

    for (const result of streamResults) {
      if (result.status === "fulfilled") {
        archive.append(result.value.stream, { name: result.value.path });
      } else {
        console.error(`Failed to fetch stream for archive:`, result.reason);
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

// Bulk download shared assets as ZIP
export async function sharedBulkDownload(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parsed = bulkDownloadSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", "Invalid input", 400);
      return;
    }

    const { assetIds } = parsed.data;

    // Get shared assets the user has access to
    const downloadAssets = await assetService.getSharedBulkDownloadAssets(
      req.userId,
      assetIds
    );

    if (downloadAssets.length === 0) {
      sendError(res, "NOT_FOUND", "No accessible assets found to download", 404);
      return;
    }

    // Set response headers for ZIP download
    const filename = downloadAssets.length === 1
      ? downloadAssets[0]!.asset.name
      : `shared-${Date.now()}.zip`;

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

    // Fetch streams with limited concurrency, then append sequentially to archive
    const storage = assetService.getStorageForBulkDownload();

    const streamResults = await allSettledWithConcurrency(
      downloadAssets.map((item) => async () => ({
        stream: await storage.getObjectStream(item.asset.storageKey) as Readable,
        path: item.path,
      })),
      5
    );

    for (const result of streamResults) {
      if (result.status === "fulfilled") {
        archive.append(result.value.stream, { name: result.value.path });
      } else {
        console.error(`Failed to fetch stream for archive:`, result.reason);
      }
    }

    // Finalize archive
    await archive.finalize();
  } catch (error) {
    console.error("Shared bulk download error:", error);
    if (!res.headersSent) {
      sendError(res, "INTERNAL_ERROR", "Failed to create download", 500);
    }
  }
}

// Generate thumbnail for an asset
export async function generateThumbnail(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    // Verify the user owns this asset
    const asset = await assetService.getAssetById(req.userId, id);
    if (!asset) {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    // Check if thumbnail generation is supported for this file type
    if (!thumbnailService.canGenerateThumbnail(asset.mimeType)) {
      sendError(res, "VALIDATION_ERROR", `Thumbnails not supported for ${asset.mimeType}`, 400);
      return;
    }

    // Generate thumbnail
    const result = await thumbnailService.generateThumbnail(id);

    if (!result.success) {
      sendError(res, "INTERNAL_ERROR", result.error ?? "Failed to generate thumbnail", 500);
      return;
    }

    sendSuccess(res, { thumbnailKey: result.thumbnailKey }, "Thumbnail generated");
  } catch (error) {
    console.error("Generate thumbnail error:", error);
    sendError(res, "INTERNAL_ERROR", "Failed to generate thumbnail", 500);
  }
}

// Batch regenerate thumbnails for all user's assets
export async function batchRegenerateThumbnails(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    // Get all user's assets that can have thumbnails generated
    const result = await assetService.listAssets(req.userId, {
      limit: 1000,
      page: 1,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    const assets = result.assets.filter(
      (asset) => !asset.thumbnailKey && thumbnailService.canGenerateThumbnail(asset.mimeType)
    );

    if (assets.length === 0) {
      sendSuccess(res, { processed: 0, succeeded: 0, failed: 0 }, "No assets need thumbnail generation");
      return;
    }

    // Generate thumbnails (in batches to avoid overwhelming the server)
    const results = await thumbnailService.generateThumbnailsBatch(assets.map((a) => a.id));

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.length - succeeded;

    sendSuccess(
      res,
      { processed: assets.length, succeeded, failed },
      `Thumbnails generated: ${succeeded} succeeded, ${failed} failed`
    );
  } catch (error) {
    console.error("Batch regenerate thumbnails error:", error);
    sendError(res, "INTERNAL_ERROR", "Failed to regenerate thumbnails", 500);
  }
}

// Batch get thumbnail URLs for multiple assets
export async function batchGetThumbnailUrls(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const parsed = batchThumbnailUrlsSchema.safeParse(req.body);
    if (!parsed.success) {
      sendError(res, "VALIDATION_ERROR", "Invalid input", 400);
      return;
    }

    const { assetIds } = parsed.data;

    // Verify the user owns these assets with a single query
    const ownedAssets = await assetService.getAssetsByIds(req.userId, assetIds);
    const ownedIds = ownedAssets.map((a) => a.id);

    if (ownedIds.length === 0) {
      sendSuccess(res, { thumbnails: {} });
      return;
    }

    // Get thumbnail URLs in batch
    const results = await thumbnailService.getThumbnailUrlsBatch(ownedIds);

    // Convert Map to plain object
    const thumbnails: Record<string, { url: string | null; canGenerate: boolean }> = {};
    for (const [id, result] of results) {
      thumbnails[id] = result;
    }

    sendSuccess(res, { thumbnails });
  } catch (error) {
    console.error("Batch get thumbnail URLs error:", error);
    sendError(res, "INTERNAL_ERROR", "Failed to get thumbnail URLs", 500);
  }
}

// Get thumbnail URL for an asset
export async function getThumbnailUrl(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    if (!id) {
      sendError(res, "VALIDATION_ERROR", "Asset ID is required", 400);
      return;
    }

    // Verify the user owns this asset or has access to it
    const asset = await assetService.getAssetById(req.userId, id);
    if (!asset) {
      sendError(res, "NOT_FOUND", "Asset not found", 404);
      return;
    }

    // Get thumbnail URL
    const url = await thumbnailService.getThumbnailUrl(id);

    if (!url) {
      // No thumbnail exists - try to generate one if possible
      if (thumbnailService.canGenerateThumbnail(asset.mimeType)) {
        sendSuccess(res, { url: null, canGenerate: true }, "Thumbnail not available");
      } else {
        sendSuccess(res, { url: null, canGenerate: false }, "Thumbnail not available");
      }
      return;
    }

    sendSuccess(res, { url });
  } catch (error) {
    console.error("Get thumbnail URL error:", error);
    sendError(res, "INTERNAL_ERROR", "Failed to get thumbnail URL", 500);
  }
}
