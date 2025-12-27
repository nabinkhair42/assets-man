import { Storage } from "@google-cloud/storage";

export interface GCSValidationResult {
  success: boolean;
  message: string;
  details?: {
    bucket: string;
    projectId?: string;
    location?: string;
  };
}

export interface GCSValidatorConfig {
  bucket: string;
  projectId?: string;
  keyFilePath?: string;
}

export async function validateGCSBucket(
  config: GCSValidatorConfig
): Promise<GCSValidationResult> {
  const storage = new Storage({
    projectId: config.projectId,
    keyFilename: config.keyFilePath,
  });

  const bucket = storage.bucket(config.bucket);

  try {
    // Check if bucket exists and we have access
    const [exists] = await bucket.exists();

    if (!exists) {
      return {
        success: false,
        message: `GCS bucket "${config.bucket}" not found`,
        details: {
          bucket: config.bucket,
          projectId: config.projectId,
        },
      };
    }

    // Get bucket metadata for location info
    let location: string | undefined;
    try {
      const [metadata] = await bucket.getMetadata();
      location = metadata.location;
    } catch {
      // Metadata access might not be available
    }

    return {
      success: true,
      message: "GCS bucket connection successful",
      details: {
        bucket: config.bucket,
        projectId: config.projectId,
        location,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    let message = `GCS bucket validation failed: ${errorMessage}`;

    if (errorMessage.includes("403") || errorMessage.includes("Permission")) {
      message = `Access denied to GCS bucket "${config.bucket}". Check your credentials.`;
    } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
      message = `GCS bucket "${config.bucket}" not found`;
    } else if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
      message = `Cannot reach GCS endpoint. Check your network connection.`;
    } else if (errorMessage.includes("Could not load the default credentials")) {
      message = `GCS credentials not configured. Set GCS_KEY_FILE_PATH or configure default credentials.`;
    }

    return {
      success: false,
      message,
      details: {
        bucket: config.bucket,
        projectId: config.projectId,
      },
    };
  }
}
