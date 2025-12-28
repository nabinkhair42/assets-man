import { Router, type IRouter } from "express";
import * as folderController from "./folder-controller.js";
import { validateBody, validateParams } from "@/utils/request-validator.js";
import {
  createFolderSchema,
  updateFolderSchema,
  moveFolderSchema,
  folderIdParamSchema,
} from "@/schema/folder-schema.js";
import { authenticate, type AuthRequest } from "@/middleware/auth-middleware.js";
import type { Response, NextFunction } from "express";

export const folderRouter: IRouter = Router();

// All routes require authentication
folderRouter.use(authenticate);

// Cast handler to handle AuthRequest
type AuthHandler = (req: AuthRequest, res: Response, next?: NextFunction) => Promise<void>;
const wrap = (fn: AuthHandler) => fn as unknown as IRouter;

// List all folders (flat)
folderRouter.get("/", wrap(folderController.getAllFolders));

// List folder contents (children of a folder or root)
folderRouter.get("/contents", wrap(folderController.getFolderContents));

// Search folders (fuzzy search)
folderRouter.get("/search", wrap(folderController.searchFolders));

// List starred folders
folderRouter.get("/starred", wrap(folderController.listStarredFolders));

// Get single folder
folderRouter.get(
  "/:id",
  validateParams(folderIdParamSchema),
  wrap(folderController.getFolder)
);

// Create folder
folderRouter.post(
  "/",
  validateBody(createFolderSchema),
  wrap(folderController.createFolder)
);

// Update folder
folderRouter.patch(
  "/:id",
  validateParams(folderIdParamSchema),
  validateBody(updateFolderSchema),
  wrap(folderController.updateFolder)
);

// Move folder
folderRouter.patch(
  "/:id/move",
  validateParams(folderIdParamSchema),
  validateBody(moveFolderSchema),
  wrap(folderController.moveFolder)
);

// Delete folder
folderRouter.delete(
  "/:id",
  validateParams(folderIdParamSchema),
  wrap(folderController.deleteFolder)
);

// Toggle starred status
folderRouter.post(
  "/:id/star",
  validateParams(folderIdParamSchema),
  wrap(folderController.toggleStarred)
);
