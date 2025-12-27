import { Storage } from "@google-cloud/storage";
import type {
  StorageConfig,
  StorageClient,
  UploadOptions,
  DownloadOptions,
  PresignedUploadResult,
  PresignedDownloadResult,
  DeleteResult,
} from "./types";

const DEFAULT_EXPIRES_IN = 3600; // 1 hour

export function createGCSClient(config: StorageConfig): StorageClient {
  const storage = new Storage({
    projectId: config.projectId,
    keyFilename: config.keyFilePath,
  });

  const bucket = storage.bucket(config.bucket);

  return {
    async getPresignedUploadUrl(
      options: UploadOptions
    ): Promise<PresignedUploadResult> {
      const expiresIn = options.expiresIn ?? DEFAULT_EXPIRES_IN;
      const file = bucket.file(options.key);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + expiresIn * 1000,
        contentType: options.contentType,
      });

      return {
        url,
        key: options.key,
        expiresIn,
      };
    },

    async getPresignedDownloadUrl(
      options: DownloadOptions
    ): Promise<PresignedDownloadResult> {
      const expiresIn = options.expiresIn ?? DEFAULT_EXPIRES_IN;
      const file = bucket.file(options.key);

      const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expiresIn * 1000,
        ...(options.filename && {
          responseDisposition: `attachment; filename="${encodeURIComponent(options.filename)}"`,
        }),
      });

      return { url, expiresIn };
    },

    async deleteObject(key: string): Promise<DeleteResult> {
      try {
        await bucket.file(key).delete();
        return { success: true, key };
      } catch {
        return { success: false, key };
      }
    },

    async deleteObjects(keys: string[]): Promise<DeleteResult[]> {
      const results = await Promise.all(
        keys.map(async (key) => {
          try {
            await bucket.file(key).delete();
            return { success: true, key };
          } catch {
            return { success: false, key };
          }
        })
      );
      return results;
    },

    async exists(key: string): Promise<boolean> {
      try {
        const [exists] = await bucket.file(key).exists();
        return exists;
      } catch {
        return false;
      }
    },

    async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
      await bucket.file(sourceKey).copy(bucket.file(destinationKey));
    },
  };
}
