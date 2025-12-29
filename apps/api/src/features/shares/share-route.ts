import { Router, type IRouter } from "express";
import * as shareController from "./share-controller.js";
import { validateParams } from "@/utils/request-validator.js";
import { shareIdParamSchema } from "@/schema/share-schema.js";
import { authenticate, type AuthRequest } from "@/middleware/auth-middleware.js";
import type { Response, NextFunction, Request } from "express";

export const shareRouter: IRouter = Router();

// Cast handler to handle AuthRequest
type AuthHandler = (req: AuthRequest, res: Response, next?: NextFunction) => Promise<void>;
type PublicHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void>;
const wrapAuth = (fn: AuthHandler) => fn as unknown as IRouter;
const wrapPublic = (fn: PublicHandler) => fn as unknown as IRouter;

// Public routes (no auth required)
// Access a link share
shareRouter.post("/link/:token/access", wrapPublic(shareController.accessLinkShare));

// Get share item details (public)
shareRouter.get("/link/:token/details", wrapPublic(shareController.getShareItemDetails));

// Download shared asset (public)
shareRouter.post("/link/:token/download", wrapPublic(shareController.downloadSharedAsset));

// All other routes require authentication
shareRouter.use(authenticate);

// Create a user share
shareRouter.post("/user", wrapAuth(shareController.createUserShare));

// Create a link share
shareRouter.post("/link", wrapAuth(shareController.createLinkShare));

// List all my shares
shareRouter.get("/mine", wrapAuth(shareController.listMyShares));

// List shares shared with me
shareRouter.get("/shared-with-me", wrapAuth(shareController.listSharedWithMe));

// List shares for a specific item
shareRouter.get("/item/:itemType/:itemId", wrapAuth(shareController.listSharesForItem));

// Get a specific share
shareRouter.get(
  "/:id",
  validateParams(shareIdParamSchema),
  wrapAuth(shareController.getShare)
);

// Update a share
shareRouter.patch(
  "/:id",
  validateParams(shareIdParamSchema),
  wrapAuth(shareController.updateShare)
);

// Delete a share
shareRouter.delete(
  "/:id",
  validateParams(shareIdParamSchema),
  wrapAuth(shareController.deleteShare)
);
