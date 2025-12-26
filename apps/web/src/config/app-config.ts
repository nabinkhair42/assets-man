export const APP_CONFIG = {
  name: "Assets Manager",
  description: "Manage your files with your own cloud storage",

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // File upload
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedMimeTypes: [
    // Images
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    // Archives
    "application/zip",
    "application/x-rar-compressed",
    // Text
    "text/plain",
    "text/csv",
    // Video
    "video/mp4",
    "video/webm",
    // Audio
    "audio/mpeg",
    "audio/wav",
  ],
} as const;
