import { Router, type IRouter } from "express";
import * as assetController from "./asset-controller.js";
import { validateBody, validateParams, validateQuery } from "@/utils/request-validator.js";
import {
  requestUploadSchema,
  updateAssetSchema,
  assetIdParamSchema,
  listAssetsQuerySchema,
} from "@/schema/asset-schema.js";
import { authenticate, type AuthRequest } from "@/middleware/auth-middleware.js";
import { checkStorageQuota } from "@/middleware/storage-quota-middleware.js";
import type { Response, NextFunction } from "express";

export const assetRouter: IRouter = Router();

// All routes require authentication
assetRouter.use(authenticate);

// Cast handler to handle AuthRequest
type AuthHandler = (req: AuthRequest, res: Response, next?: NextFunction) => Promise<void>;
const wrap = (fn: AuthHandler) => fn as unknown as IRouter;

// List assets (with optional folder filter and pagination)
assetRouter.get(
  "/",
  validateQuery(listAssetsQuerySchema),
  wrap(assetController.listAssets)
);

// List starred assets
assetRouter.get("/starred", wrap(assetController.listStarredAssets));

// Request upload URL (creates asset record and returns presigned URL)
assetRouter.post(
  "/upload",
  validateBody(requestUploadSchema),
  checkStorageQuota as unknown as IRouter,
  wrap(assetController.requestUpload)
);

// Get single asset
assetRouter.get(
  "/:id",
  validateParams(assetIdParamSchema),
  wrap(assetController.getAsset)
);

// Get download URL for asset
assetRouter.get(
  "/:id/download",
  validateParams(assetIdParamSchema),
  wrap(assetController.getDownloadUrl)
);

// Get download URL for shared asset (or owned asset)
assetRouter.get(
  "/:id/shared-download",
  validateParams(assetIdParamSchema),
  wrap(assetController.getSharedDownloadUrl)
);

// Update asset (rename or move)
assetRouter.patch(
  "/:id",
  validateParams(assetIdParamSchema),
  validateBody(updateAssetSchema),
  wrap(assetController.updateAsset)
);

// Delete asset
assetRouter.delete(
  "/:id",
  validateParams(assetIdParamSchema),
  wrap(assetController.deleteAsset)
);

// Toggle starred status
assetRouter.post(
  "/:id/star",
  validateParams(assetIdParamSchema),
  wrap(assetController.toggleStarred)
);

// Copy asset
assetRouter.post(
  "/:id/copy",
  validateParams(assetIdParamSchema),
  wrap(assetController.copyAsset)
);

// Bulk download as ZIP
assetRouter.post("/bulk-download", wrap(assetController.bulkDownload));

// Bulk download shared assets as ZIP
assetRouter.post("/shared-bulk-download", wrap(assetController.sharedBulkDownload));

// Batch regenerate thumbnails for all user's assets without thumbnails
assetRouter.post("/thumbnails/regenerate", wrap(assetController.batchRegenerateThumbnails));

// Generate thumbnail for an asset
assetRouter.post(
  "/:id/thumbnail",
  validateParams(assetIdParamSchema),
  wrap(assetController.generateThumbnail)
);

// Get thumbnail URL for an asset
assetRouter.get(
  "/:id/thumbnail",
  validateParams(assetIdParamSchema),
  wrap(assetController.getThumbnailUrl)
);
