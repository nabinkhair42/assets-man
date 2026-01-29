import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { AxiosError } from "axios"
import type { ApiError } from "@/types/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract error message from API error response
 * Falls back to default message if unable to extract
 */
export function getApiErrorMessage(
  error: unknown,
  defaultMessage = "Something went wrong"
): string {
  if (!error) return defaultMessage;

  // Handle Axios errors
  const axiosError = error as AxiosError<ApiError>;
  if (axiosError.response?.data?.error?.message) {
    return axiosError.response.data.error.message;
  }

  // Handle generic Error
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * Extract success message from API response
 */
export function getApiSuccessMessage(
  response: { data?: { message?: string } },
  defaultMessage = "Success"
): string {
  return response?.data?.message || defaultMessage;
}

/**
 * Common MIME type mappings for file extensions
 * Used when browser doesn't provide a MIME type
 */
const MIME_TYPE_MAP: Record<string, string> = {
  // Text & Code
  ".txt": "text/plain",
  ".json": "application/json",
  ".xml": "application/xml",
  ".html": "text/html",
  ".htm": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".ts": "application/typescript",
  ".tsx": "application/typescript",
  ".jsx": "application/javascript",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".yaml": "application/x-yaml",
  ".yml": "application/x-yaml",
  ".sh": "application/x-sh",
  ".py": "text/x-python",
  ".rb": "text/x-ruby",
  ".go": "text/x-go",
  ".rs": "text/x-rust",
  ".java": "text/x-java",
  ".c": "text/x-c",
  ".cpp": "text/x-c++",
  ".h": "text/x-c",
  ".hpp": "text/x-c++",
  ".sql": "application/sql",
  ".php": "application/x-php",
  ".swift": "text/x-swift",
  ".kt": "text/x-kotlin",
  ".scala": "text/x-scala",
  ".r": "text/x-r",
  ".lua": "text/x-lua",
  ".pl": "text/x-perl",
  ".log": "text/plain",
  ".env": "text/plain",
  ".gitignore": "text/plain",
  ".dockerignore": "text/plain",
  ".editorconfig": "text/plain",

  // Images
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".bmp": "image/bmp",
  ".tiff": "image/tiff",
  ".tif": "image/tiff",
  ".avif": "image/avif",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".raw": "image/raw",
  ".psd": "image/vnd.adobe.photoshop",
  ".ai": "application/illustrator",

  // Documents
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".odt": "application/vnd.oasis.opendocument.text",
  ".ods": "application/vnd.oasis.opendocument.spreadsheet",
  ".odp": "application/vnd.oasis.opendocument.presentation",
  ".rtf": "application/rtf",
  ".epub": "application/epub+zip",

  // Archives
  ".zip": "application/zip",
  ".rar": "application/x-rar-compressed",
  ".7z": "application/x-7z-compressed",
  ".tar": "application/x-tar",
  ".gz": "application/gzip",
  ".bz2": "application/x-bzip2",
  ".xz": "application/x-xz",

  // Video
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".wmv": "video/x-ms-wmv",
  ".flv": "video/x-flv",
  ".m4v": "video/x-m4v",
  ".mpeg": "video/mpeg",
  ".mpg": "video/mpeg",
  ".3gp": "video/3gpp",

  // Audio
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".flac": "audio/flac",
  ".aac": "audio/aac",
  ".m4a": "audio/mp4",
  ".wma": "audio/x-ms-wma",
  ".aiff": "audio/aiff",
  ".mid": "audio/midi",
  ".midi": "audio/midi",

  // Fonts
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".eot": "application/vnd.ms-fontobject",

  // Other
  ".exe": "application/x-msdownload",
  ".dmg": "application/x-apple-diskimage",
  ".iso": "application/x-iso9660-image",
  ".apk": "application/vnd.android.package-archive",
  ".ipa": "application/octet-stream",
  ".deb": "application/x-debian-package",
  ".rpm": "application/x-rpm",
  ".torrent": "application/x-bittorrent",
};

/**
 * Get MIME type for a file
 * Uses browser-provided type first, falls back to extension mapping
 */
export function getMimeType(file: File): string {
  // If browser provides a valid MIME type, use it
  if (file.type && file.type.length > 0) {
    return file.type;
  }

  // Extract extension from filename
  const lastDotIndex = file.name.lastIndexOf(".");
  if (lastDotIndex === -1) {
    return "application/octet-stream"; // No extension, use binary
  }

  const ext = file.name.slice(lastDotIndex).toLowerCase();
  return MIME_TYPE_MAP[ext] || "application/octet-stream";
}
