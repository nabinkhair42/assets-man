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

export function isPreviewable(mimeType: string): boolean {
  const allTypes: readonly string[] =
    Object.values(PREVIEWABLE_MIME_TYPES).flat();
  return allTypes.includes(mimeType);
}

export function getFileCategory(
  mimeType: string
): "image" | "video" | "audio" | "document" | "other" {
  if (PREVIEWABLE_MIME_TYPES.image.includes(mimeType as never)) return "image";
  if (PREVIEWABLE_MIME_TYPES.video.includes(mimeType as never)) return "video";
  if (PREVIEWABLE_MIME_TYPES.audio.includes(mimeType as never)) return "audio";
  if (PREVIEWABLE_MIME_TYPES.document.includes(mimeType as never))
    return "document";
  return "other";
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
