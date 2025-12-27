import { ErrorResponses } from "@/utils/response-utils.js";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z, type ZodSchema } from "zod";

type ValidationTarget = "body" | "query" | "params";

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

// Extend Express Request to include validated data
declare global {
  namespace Express {
    interface Request {
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "root";
    const existing = details[path] ?? [];
    existing.push(issue.message);
    details[path] = existing;
  }

  return details;
}

export function validate(options: ValidateOptions): RequestHandler {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const targets: ValidationTarget[] = ["body", "query", "params"];
    const errors: Record<string, string[]> = {};

    // Initialize validated object
    req.validated = {};

    for (const target of targets) {
      const schema = options[target];
      if (!schema) continue;

      const result = await schema.safeParseAsync(req[target]);

      if (!result.success) {
        Object.assign(errors, formatZodErrors(result.error));
      } else {
        // Store validated/transformed data
        req.validated[target] = result.data;

        // For body, we can safely reassign
        if (target === "body") {
          req.body = result.data;
        }
        // For query and params, update the original object in place
        if (target === "query") {
          const data = result.data as Record<string, unknown>;
          for (const [key, value] of Object.entries(data)) {
            (req.query as Record<string, unknown>)[key] = value;
          }
        }
        if (target === "params") {
          const data = result.data as Record<string, unknown>;
          for (const [key, value] of Object.entries(data)) {
            (req.params as Record<string, unknown>)[key] = value;
          }
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      ErrorResponses.validationError(res, "Validation failed", errors);
      return;
    }

    next();
  };
}

export function validateBody<T extends ZodSchema>(schema: T): RequestHandler {
  return validate({ body: schema });
}

export function validateQuery<T extends ZodSchema>(schema: T): RequestHandler {
  return validate({ query: schema });
}

export function validateParams<T extends ZodSchema>(schema: T): RequestHandler {
  return validate({ params: schema });
}
