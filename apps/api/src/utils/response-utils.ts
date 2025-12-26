import type { Response } from "express";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ErrorCode,
  PaginationMeta,
} from "@repo/shared";

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: ErrorCode,
  message: string,
  statusCode = 400,
  details?: Record<string, string[]>
): void {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };
  res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    pagination,
  });
}

// Common error responses
export const ErrorResponses = {
  unauthorized: (res: Response, message = "Unauthorized") =>
    sendError(res, "UNAUTHORIZED", message, 401),

  forbidden: (res: Response, message = "Forbidden") =>
    sendError(res, "FORBIDDEN", message, 403),

  notFound: (res: Response, message = "Not found") =>
    sendError(res, "NOT_FOUND", message, 404),

  validationError: (
    res: Response,
    message = "Validation failed",
    details?: Record<string, string[]>
  ) => sendError(res, "VALIDATION_ERROR", message, 400, details),

  internalError: (res: Response, message = "Internal server error") =>
    sendError(res, "INTERNAL_ERROR", message, 500),
};
