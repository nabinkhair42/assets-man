import { Router, type IRouter } from "express";
import * as storageController from "./storage-controller.js";
import { authenticate, type AuthRequest } from "@/middleware/auth-middleware.js";
import type { Response, NextFunction } from "express";

export const storageRouter: IRouter = Router();

// Cast handler to handle AuthRequest
type AuthHandler = (
  req: AuthRequest,
  res: Response,
  next?: NextFunction
) => Promise<void>;
const wrapAuth = (fn: AuthHandler) => fn as unknown as IRouter;

// All routes require authentication
storageRouter.use(authenticate);

// Get storage statistics
storageRouter.get("/stats", wrapAuth(storageController.getStorageStats));

// Recalculate storage (useful for fixing inconsistencies)
storageRouter.post("/recalculate", wrapAuth(storageController.recalculateStorage));
