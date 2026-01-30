// File preview support
export const PREVIEWABLE_MIME_TYPES = {
  image: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  video: ["video/mp4", "video/webm", "video/ogg"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg"],
  document: ["application/pdf"],
} as const;

// Precomputed lookup maps for O(1) checks (Rule 7.11)
const MIME_TO_CATEGORY = new Map<string, "image" | "video" | "audio" | "document">();
for (const [category, types] of Object.entries(PREVIEWABLE_MIME_TYPES)) {
  for (const type of types) {
    MIME_TO_CATEGORY.set(type, category as "image" | "video" | "audio" | "document");
  }
}

export function isPreviewable(mimeType: string): boolean {
  return MIME_TO_CATEGORY.has(mimeType);
}

export function getFileCategory(
  mimeType: string
): "image" | "video" | "audio" | "document" | "other" {
  return MIME_TO_CATEGORY.get(mimeType) ?? "other";
}

// Auth constants
export const AUTH_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: 15 * 60, // 15 minutes in seconds
  REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7 days in seconds
  BCRYPT_ROUNDS: 12,
} as const;

// Pagination defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
