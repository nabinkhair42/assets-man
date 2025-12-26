import type { Request, Response } from "express";
import { ErrorResponses } from "@/utils/response-utils.js";

export function notFoundHandler(_req: Request, res: Response): void {
  ErrorResponses.notFound(res, "Route not found");
}
