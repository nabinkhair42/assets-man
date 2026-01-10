export type FileType = "image" | "video" | "audio" | "pdf" | "document" | "text" | "code" | "other";

export interface PreviewAsset {
  id: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface PreviewComponentProps {
  asset: PreviewAsset;
  previewUrl: string;
  onDownload: () => void;
}

// File extensions that should be treated as code files
const codeExtensions = [
  ".mdx", ".tsx", ".jsx", ".ts", ".js", ".json",
  ".yaml", ".yml", ".toml", ".xml", ".html", ".css", ".scss", ".less",
  ".py", ".rb", ".go", ".rs", ".java", ".kt", ".swift", ".c", ".cpp", ".h",
  ".sh", ".bash", ".zsh", ".ps1", ".sql", ".graphql", ".vue", ".svelte",
];

export function getFileType(mimeType: string, fileName?: string): FileType {
  // Check file extension first for code files (handles MDX, TSX, etc.)
  if (fileName) {
    const ext = fileName.toLowerCase().substring(fileName.lastIndexOf("."));
    if (codeExtensions.includes(ext)) {
      return "code";
    }
  }

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "document";
  }
  if (mimeType === "application/json") return "code";
  if (mimeType === "text/csv" || mimeType === "application/csv") return "text";
  if (
    mimeType.startsWith("text/") ||
    mimeType === "application/javascript" ||
    mimeType === "application/typescript" ||
    mimeType === "application/xml" ||
    mimeType === "application/x-yaml" ||
    mimeType === "application/x-sh"
  ) {
    return "text";
  }
  return "other";
}

export function isPreviewable(mimeType: string, fileName?: string): boolean {
  const fileType = getFileType(mimeType, fileName);
  return fileType !== "other" && fileType !== "document";
}
