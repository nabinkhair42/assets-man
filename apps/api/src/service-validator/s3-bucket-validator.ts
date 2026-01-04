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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorCode = (error as any)?.$metadata?.httpStatusCode || (error as any)?.Code || "";

    let message = `S3 bucket validation failed: ${errorName || errorMessage}`;

    if (errorName === "NotFound" || errorMessage.includes("404") || errorCode === 404) {
      message = `S3 bucket "${config.bucket}" not found`;
    } else if (errorName === "AccessDenied" || errorMessage.includes("403") || errorCode === 403) {
      message = `Access denied to S3 bucket "${config.bucket}". Check your credentials.`;
    } else if (errorMessage.includes("getaddrinfo") || errorMessage.includes("ENOTFOUND")) {
      message = `Cannot reach S3 endpoint. Check your network connection.`;
    } else if (errorName === "CredentialsProviderError" || errorMessage.includes("credentials")) {
      message = `AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env`;
    } else if (errorName === "InvalidAccessKeyId" || errorMessage.includes("InvalidAccessKeyId")) {
      message = `Invalid AWS access key. Check AWS_ACCESS_KEY_ID in .env`;
    } else if (errorName === "SignatureDoesNotMatch" || errorMessage.includes("SignatureDoesNotMatch")) {
      message = `Invalid AWS secret key. Check AWS_SECRET_ACCESS_KEY in .env`;
    } else if (!config.accessKeyId || !config.secretAccessKey) {
      message = `AWS credentials missing. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env`;
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
