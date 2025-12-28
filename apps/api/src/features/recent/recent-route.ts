import { Router, type IRouter } from "express";
import * as recentController from "./recent-controller.js";
import { authenticate, type AuthRequest } from "@/middleware/auth-middleware.js";
import type { Response, NextFunction } from "express";

export const recentRouter: IRouter = Router();

// All routes require authentication
recentRouter.use(authenticate);

// Cast handler to handle AuthRequest
type AuthHandler = (req: AuthRequest, res: Response, next?: NextFunction) => Promise<void>;
const wrap = (fn: AuthHandler) => fn as unknown as IRouter;

// List recent items
recentRouter.get("/", wrap(recentController.listRecentItems));

// Record access to an item
recentRouter.post("/", wrap(recentController.recordAccess));

// Clear all recent history
recentRouter.delete("/", wrap(recentController.clearRecentHistory));

// Remove a specific item from recent
recentRouter.delete("/:id", wrap(recentController.removeFromRecent));
