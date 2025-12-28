/**
 * Format bytes to human readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date to relative time string (e.g., "5m ago", "2d ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

/**
 * Truncate a file name while preserving the extension
 * @param name - The file or folder name to truncate
 * @param maxLength - Maximum length of the truncated name (default: 20)
 * @param isFolder - Whether the item is a folder (no extension handling)
 */
export function truncateFileName(name: string, maxLength: number = 20, isFolder: boolean = false): string {
  if (name.length <= maxLength) return name;

  if (isFolder) {
    return `${name.slice(0, maxLength - 3)}...`;
  }

  // Find the last dot for extension
  const lastDotIndex = name.lastIndexOf(".");

  // If no extension or dot is at the start (hidden files), treat as folder
  if (lastDotIndex <= 0) {
    return `${name.slice(0, maxLength - 3)}...`;
  }

  const extension = name.slice(lastDotIndex);
  const baseName = name.slice(0, lastDotIndex);

  // Calculate how much of the base name we can keep
  const availableLength = maxLength - extension.length - 3; // 3 for "..."

  if (availableLength <= 0) {
    // Extension is too long, just truncate everything
    return `${name.slice(0, maxLength - 3)}...`;
  }

  return `${baseName.slice(0, availableLength)}...${extension}`;
}
