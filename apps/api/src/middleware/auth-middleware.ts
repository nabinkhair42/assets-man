import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "@/utils/auth-utils.js";
import { ErrorResponses } from "@/utils/response-utils.js";

export interface AuthRequest extends Request {
  userId: string;
  userEmail: string;
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ErrorResponses.unauthorized(res, "No token provided");
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyAccessToken(token);

  if (!payload) {
    ErrorResponses.unauthorized(res, "Invalid or expired token");
    return;
  }

  // Attach user info to request
  (req as AuthRequest).userId = payload.sub;
  (req as AuthRequest).userEmail = payload.email;

  next();
}

// Optional auth - doesn't fail if no token, just doesn't set userId
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);

    if (payload) {
      (req as AuthRequest).userId = payload.sub;
      (req as AuthRequest).userEmail = payload.email;
    }
  }

  next();
}
