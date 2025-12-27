import type { Response } from "express";
import { sendSuccess, sendError, sendPaginated } from "@/utils/response-utils.js";
import * as assetService from "@/features/assets/asset-services.js";
import * as folderService from "@/features/folders/folder-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import type { ListTrashQuery, TrashItemIdParam, TrashItemTypeParam } from "@/schema/trash-schema.js";

export async function listTrash(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as unknown as ListTrashQuery;

    const [assetsResult, foldersResult] = await Promise.all([
      assetService.listTrashedAssets(req.userId, query),
      folderService.listTrashedFolders(req.userId, query),
    ]);

    // Combine both results
    const items = [
      ...foldersResult.folders.map((f) => ({ ...f, itemType: "folder" as const })),
      ...assetsResult.assets.map((a) => ({ ...a, itemType: "asset" as const })),
    ].sort((a, b) => {
      const aDate = a.trashedAt ? new Date(a.trashedAt).getTime() : 0;
      const bDate = b.trashedAt ? new Date(b.trashedAt).getTime() : 0;
      return bDate - aDate;
    });

    const total = assetsResult.total + foldersResult.total;
    const totalPages = Math.ceil(total / query.limit);

    sendPaginated(res, items, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
    });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to list trash", 500);
  }
}

export async function restoreItem(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params as unknown as TrashItemIdParam;
    const { type } = req.query as unknown as TrashItemTypeParam;

    if (type === "asset") {
      const asset = await assetService.restoreAsset(req.userId, id);
      sendSuccess(res, { asset }, "Asset restored");
    } else {
      const folder = await folderService.restoreFolder(req.userId, id);
      sendSuccess(res, { folder }, "Folder restored");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Item not found in trash", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to restore item", 500);
  }
}

export async function permanentlyDelete(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params as unknown as TrashItemIdParam;
    const { type } = req.query as unknown as TrashItemTypeParam;

    if (type === "asset") {
      await assetService.permanentlyDeleteAsset(req.userId, id);
    } else {
      await folderService.permanentlyDeleteFolder(req.userId, id);
    }

    sendSuccess(res, null, "Item permanently deleted");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "NOT_FOUND") {
      sendError(res, "NOT_FOUND", "Item not found in trash", 404);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Failed to delete item", 500);
  }
}

export async function emptyTrash(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const [deletedAssets, deletedFolders] = await Promise.all([
      assetService.emptyTrashAssets(req.userId),
      folderService.emptyTrashFolders(req.userId),
    ]);

    sendSuccess(res, {
      deletedAssets,
      deletedFolders,
      total: deletedAssets + deletedFolders,
    }, "Trash emptied");
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to empty trash", 500);
  }
}
