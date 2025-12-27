import { Router, type IRouter } from "express";
import * as trashController from "./trash-controller.js";
import { validateParams, validateQuery } from "@/utils/request-validator.js";
import {
  trashItemIdParamSchema,
  trashItemTypeParamSchema,
  listTrashQuerySchema,
} from "@/schema/trash-schema.js";
import { authenticate, type AuthRequest } from "@/middleware/auth-middleware.js";
import type { Response, NextFunction } from "express";

export const trashRouter: IRouter = Router();

// All routes require authentication
trashRouter.use(authenticate);

// Cast handler to handle AuthRequest
type AuthHandler = (req: AuthRequest, res: Response, next?: NextFunction) => Promise<void>;
const wrap = (fn: AuthHandler) => fn as unknown as IRouter;

// List all trashed items (folders and assets combined)
trashRouter.get(
  "/",
  validateQuery(listTrashQuerySchema),
  wrap(trashController.listTrash)
);

// Restore an item from trash
trashRouter.post(
  "/:id/restore",
  validateParams(trashItemIdParamSchema),
  validateQuery(trashItemTypeParamSchema),
  wrap(trashController.restoreItem)
);

// Permanently delete an item from trash
trashRouter.delete(
  "/:id",
  validateParams(trashItemIdParamSchema),
  validateQuery(trashItemTypeParamSchema),
  wrap(trashController.permanentlyDelete)
);

// Empty all trash
trashRouter.delete(
  "/",
  wrap(trashController.emptyTrash)
);
