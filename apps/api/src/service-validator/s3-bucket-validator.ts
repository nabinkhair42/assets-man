import { S3Client, HeadBucketCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export interface S3ValidationResult {
  success: boolean;
  message: string;
  details?: {
    bucket: string;
    region: string;
    objectCount?: number;
  };
}

export interface S3ValidatorConfig {
  bucket: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export async function validateS3Bucket(
  config: S3ValidatorConfig
): Promise<S3ValidationResult> {
  const region = config.region ?? "us-east-1";

  const client = new S3Client({
    region,
    credentials:
      config.accessKeyId && config.secretAccessKey
        ? {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          }
        : undefined,
  });

  try {
    // Check if bucket exists and we have access
    await client.send(
      new HeadBucketCommand({
        Bucket: config.bucket,
      })
    );

    // Optional: Get object count (limited to first page)
    let objectCount: number | undefined;
    try {
      const listResult = await client.send(
        new ListObjectsV2Command({
          Bucket: config.bucket,
          MaxKeys: 1,
        })
      );
      objectCount = listResult.KeyCount ?? 0;
    } catch {
      // List permission might not be available, that's ok
    }

    return {
      success: true,
      message: "S3 bucket connection successful",
      details: {
        bucket: config.bucket,
        region,
        objectCount,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof Error ? error.name : "";

    let message = `S3 bucket validation failed: ${errorMessage}`;

    if (errorName === "NotFound" || errorMessage.includes("404")) {
      message = `S3 bucket "${config.bucket}" not found`;
    } else if (errorName === "AccessDenied" || errorMessage.includes("403")) {
      message = `Access denied to S3 bucket "${config.bucket}". Check your credentials.`;
    } else if (errorMessage.includes("getaddrinfo") || errorMessage.includes("ENOTFOUND")) {
      message = `Cannot reach S3 endpoint. Check your network connection.`;
    }

    return {
      success: false,
      message,
      details: {
        bucket: config.bucket,
        region,
      },
    };
  }
}
