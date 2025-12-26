import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageConfig,
  StorageClient,
  UploadOptions,
  PresignedUploadResult,
  PresignedDownloadResult,
  DeleteResult,
} from "./types.js";

const DEFAULT_EXPIRES_IN = 3600; // 1 hour

export function createS3Client(config: StorageConfig): StorageClient {
  const client = new S3Client({
    region: config.region ?? "us-east-1",
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
  });

  const bucket = config.bucket;

  return {
    async getPresignedUploadUrl(
      options: UploadOptions
    ): Promise<PresignedUploadResult> {
      const expiresIn = options.expiresIn ?? DEFAULT_EXPIRES_IN;

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: options.key,
        ContentType: options.contentType,
      });

      const url = await getSignedUrl(client, command, { expiresIn });

      return {
        url,
        key: options.key,
        expiresIn,
      };
    },

    async getPresignedDownloadUrl(
      key: string,
      expiresIn = DEFAULT_EXPIRES_IN
    ): Promise<PresignedDownloadResult> {
      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      const url = await getSignedUrl(client, command, { expiresIn });

      return { url, expiresIn };
    },

    async deleteObject(key: string): Promise<DeleteResult> {
      try {
        await client.send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
        return { success: true, key };
      } catch {
        return { success: false, key };
      }
    },

    async deleteObjects(keys: string[]): Promise<DeleteResult[]> {
      if (keys.length === 0) return [];

      try {
        await client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: {
              Objects: keys.map((key) => ({ Key: key })),
            },
          })
        );
        return keys.map((key) => ({ success: true, key }));
      } catch {
        return keys.map((key) => ({ success: false, key }));
      }
    },

    async exists(key: string): Promise<boolean> {
      try {
        await client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: key,
          })
        );
        return true;
      } catch {
        return false;
      }
    },

    async copyObject(sourceKey: string, destinationKey: string): Promise<void> {
      await client.send(
        new CopyObjectCommand({
          Bucket: bucket,
          CopySource: `${bucket}/${sourceKey}`,
          Key: destinationKey,
        })
      );
    },
  };
}
