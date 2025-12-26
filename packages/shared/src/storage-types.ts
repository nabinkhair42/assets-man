// Storage provider types
export type StorageProvider = "s3" | "gcs";

export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    keyFilePath?: string; // For GCS
  };
}

// Upload types
export interface PresignedUrlRequest {
  fileName: string;
  mimeType: string;
  size: number;
  folderId?: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  expiresIn: number;
}

// Asset types (for client)
export interface AssetPublic {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderPublic {
  id: string;
  name: string;
  parentId: string | null;
  path: string;
  createdAt: string;
  updatedAt: string;
}
