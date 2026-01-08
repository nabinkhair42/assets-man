import type { Request, Response } from "express";
import { sendSuccess, sendError } from "@/utils/response-utils.js";
import * as authService from "./auth-services.js";
import { getStorageStats } from "@/features/storage/storage-services.js";
import type { RegisterInput, LoginInput } from "@/schema/auth-schema.js";
import { AUTH_CONSTANTS } from "@repo/shared";

const REFRESH_TOKEN_COOKIE = "refresh_token";

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY * 1000,
    path: "/",
  });
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as RegisterInput;
    const userAgent = req.get("user-agent");
    const ipAddress = req.ip;

    const result = await authService.register(input, userAgent, ipAddress);
    sendSuccess(res, result, "Registration successful", 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "EMAIL_EXISTS") {
      sendError(res, "EMAIL_EXISTS", "Email already registered", 409);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Registration failed", 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const input = req.body as LoginInput;
    const userAgent = req.get("user-agent");
    const ipAddress = req.ip;

    const { response, refreshToken } = await authService.login(
      input,
      userAgent,
      ipAddress
    );

    setRefreshTokenCookie(res, refreshToken);
    sendSuccess(res, response, "Login successful");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message === "INVALID_CREDENTIALS") {
      sendError(res, "INVALID_CREDENTIALS", "Invalid email or password", 401);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Login failed", 500);
  }
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!token) {
      sendError(res, "INVALID_TOKEN", "Refresh token not provided", 401);
      return;
    }

    const { tokens, newRefreshToken } = await authService.refresh(token);

    setRefreshTokenCookie(res, newRefreshToken);
    sendSuccess(res, { tokens }, "Token refreshed");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    clearRefreshTokenCookie(res);

    if (message === "INVALID_TOKEN" || message === "TOKEN_EXPIRED") {
      sendError(res, message as "INVALID_TOKEN", "Invalid or expired token", 401);
      return;
    }

    sendError(res, "INTERNAL_ERROR", "Token refresh failed", 500);
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const token = req.cookies?.[REFRESH_TOKEN_COOKIE];

    if (token) {
      await authService.logout(token);
    }

    clearRefreshTokenCookie(res);
    sendSuccess(res, null, "Logged out successfully");
  } catch {
    clearRefreshTokenCookie(res);
    sendSuccess(res, null, "Logged out");
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  try {
    // userId is set by auth middleware
    const userId = (req as Request & { userId?: string }).userId;

    if (!userId) {
      sendError(res, "UNAUTHORIZED", "Not authenticated", 401);
      return;
    }

    // Fetch user and storage stats in parallel
    const [user, storageStats] = await Promise.all([
      authService.getUserById(userId),
      getStorageStats(userId).catch(() => null), // Don't fail if storage stats fail
    ]);

    if (!user) {
      sendError(res, "USER_NOT_FOUND", "User not found", 404);
      return;
    }

    sendSuccess(res, { user, storageStats });
  } catch {
    sendError(res, "INTERNAL_ERROR", "Failed to get user", 500);
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body as { email: string };

    if (!email) {
      sendError(res, "VALIDATION_ERROR", "Email is required", 400);
      return;
    }

    const result = await authService.requestPasswordReset(email);

    if (!result.success) {
      sendError(res, "NOT_FOUND", result.message, 404);
      return;
    }

    sendSuccess(res, null, result.message);
  } catch (error) {
    console.error("Forgot password error:", error);
    sendError(res, "INTERNAL_ERROR", "Failed to process request. Please try again.", 500);
  }
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  try {
    const { token, password } = req.body as { token: string; password: string };

    if (!token || !password) {
      sendError(res, "VALIDATION_ERROR", "Token and password are required", 400);
      return;
    }

    const result = await authService.resetPassword(token, password);

    if (!result.success) {
      sendError(res, "INVALID_TOKEN", result.message, 400);
      return;
    }

    sendSuccess(res, null, result.message);
  } catch (error) {
    console.error("Reset password error:", error);
    sendError(res, "INTERNAL_ERROR", "Failed to reset password", 500);
  }
}
