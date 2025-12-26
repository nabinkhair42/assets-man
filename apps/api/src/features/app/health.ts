import { Router, type IRouter } from "express";
import { sendSuccess } from "@/utils/response-utils.js";

export const healthRouter: IRouter = Router();

healthRouter.get("/", (_req, res) => {
  sendSuccess(res, {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
