import type { Request, Response, NextFunction, RequestHandler } from "express";
import { z, type ZodSchema } from "zod";
import { ErrorResponses } from "./response-utils.js";

type ValidationTarget = "body" | "query" | "params";

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
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

    for (const target of targets) {
      const schema = options[target];
      if (!schema) continue;

      const result = await schema.safeParseAsync(req[target]);

      if (!result.success) {
        Object.assign(errors, formatZodErrors(result.error));
      } else {
        req[target] = result.data;
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
