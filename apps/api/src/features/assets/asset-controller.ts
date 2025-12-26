import type { Response } from "express";
import { sendSuccess, sendError } from "@/utils/response-utils.js";
import * as assetService from "./asset-services.js";
import type { AuthRequest } from "@/middleware/auth-middleware.js";
import type {
  RequestUploadInput,
  UpdateAssetInput,
  ListAssetsQuery,
} from "@/schema/asset-schema.js";

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

export async function listAssets(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const query = req.query as unknown as ListAssetsQuery;
    const result = await assetService.listAssets(req.userId, query);
    sendSuccess(res, result);
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
