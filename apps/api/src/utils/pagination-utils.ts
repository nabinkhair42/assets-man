import { PAGINATION_DEFAULTS, type PaginationMeta } from "@repo/shared";

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  offset: number;
  limit: number;
  page: number;
}

export function parsePagination(input: PaginationInput): PaginationResult {
  const page = Math.max(1, input.page || PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    Math.max(1, input.limit || PAGINATION_DEFAULTS.LIMIT),
    PAGINATION_DEFAULTS.MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  return { offset, limit, page };
}

export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
