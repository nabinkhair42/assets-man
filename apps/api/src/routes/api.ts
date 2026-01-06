import { Router, type IRouter } from "express";
import { healthRouter } from "@/features/app/index.js";
import { authRouter } from "@/features/auth/auth-route.js";
import { folderRouter } from "@/features/folders/index.js";
import { assetRouter } from "@/features/assets/index.js";
import { trashRouter } from "@/features/trash/index.js";
import { recentRouter } from "@/features/recent/index.js";
import { shareRouter } from "@/features/shares/index.js";
import { storageRouter } from "@/features/storage/index.js";

const apiRouter: IRouter = Router();

// API routes
apiRouter.use("/auth", authRouter);
apiRouter.use("/folders", folderRouter);
apiRouter.use("/assets", assetRouter);
apiRouter.use("/trash", trashRouter);
apiRouter.use("/recent", recentRouter);
apiRouter.use("/shares", shareRouter);
apiRouter.use("/storage", storageRouter);

export { apiRouter, healthRouter };
