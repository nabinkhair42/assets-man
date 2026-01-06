import { Router, type IRouter } from "express";
import { sendSuccess } from "@/utils/response-utils.js";

export const appRouter: IRouter = Router();

appRouter.get("/", (_req, res) => {
  sendSuccess(res, {
    name: "Assets Man API",
    version: "1.0.0",
    description: "An open source alternative for google drive",
  });
});
