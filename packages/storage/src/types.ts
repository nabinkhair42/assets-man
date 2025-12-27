export type StorageProvider = "s3" | "gcs";

export interface StorageConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
  // S3 credentials
  accessKeyId?: string;
  secretAccessKey?: string;
  // GCS credentials
  projectId?: string;
  keyFilePath?: string;
}

export interface UploadOptions {
  key: string;
  contentType: string;
  expiresIn?: number; // seconds, default 3600
}

export interface PresignedUploadResult {
  url: string;
  key: string;
  expiresIn: number;
}

export interface PresignedDownloadResult {
  url: string;
  expiresIn: number;
}

export interface DeleteResult {
  success: boolean;
  key: string;
}

export interface DownloadOptions {
  key: string;
  expiresIn?: number;
  filename?: string; // Forces download with this filename
}

export interface StorageClient {
  /**
   * Generate a presigned URL for uploading a file
   */
  getPresignedUploadUrl(options: UploadOptions): Promise<PresignedUploadResult>;

  /**
   * Generate a presigned URL for downloading a file
   */
  getPresignedDownloadUrl(
    options: DownloadOptions
  ): Promise<PresignedDownloadResult>;

  /**
   * Delete a file from storage
   */
  deleteObject(key: string): Promise<DeleteResult>;

  /**
   * Delete multiple files from storage
   */
  deleteObjects(keys: string[]): Promise<DeleteResult[]>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Copy a file within storage
   */
  copyObject(sourceKey: string, destinationKey: string): Promise<void>;
}
