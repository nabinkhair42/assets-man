export const APP_CONFIG = {
  name: "Assets Man",
  description: "Manage your files with your own cloud storage",

  // Pagination
  defaultPageSize: 20,
  maxPageSize: 100,

  // File upload
  maxFileSize: 100 * 1024 * 1024, // 100MB
  // Note: All file types are now supported. MIME types are auto-detected from file extension.
} as const;
