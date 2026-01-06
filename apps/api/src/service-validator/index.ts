import { validateDbConnection, type DbValidationResult } from "./db-connection-validator.js";
import { validateS3Bucket, type S3ValidationResult } from "./s3-bucket-validator.js";
import { validateGCSBucket, type GCSValidationResult } from "./gc-bucket-validator.js";
import { logConfig, type ConfigLogOptions } from "./config-logger.js";

export { validateDbConnection, validateS3Bucket, validateGCSBucket, logConfig };
export type { DbValidationResult, S3ValidationResult, GCSValidationResult, ConfigLogOptions };

export interface ServiceValidationConfig {
  databaseUrl: string;
  storageProvider: "s3" | "gcs";
  storageBucket: string;
  storageRegion?: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  gcsProjectId?: string;
  gcsKeyFilePath?: string;
}

export interface ValidationResults {
  database: DbValidationResult;
  storage: S3ValidationResult | GCSValidationResult;
  allPassed: boolean;
}

/**
 * Validates all required services before starting the server.
 * Returns validation results for each service.
 */
export async function validateServices(
  config: ServiceValidationConfig
): Promise<ValidationResults> {
  console.log("\n🔍 Validating services...\n");

  // Validate database
  console.log("  📦 Checking database connection...");
  const dbResult = await validateDbConnection(config.databaseUrl);
  logResult("Database", dbResult.success, dbResult.message, dbResult.details);

  // Validate storage
  let storageResult: S3ValidationResult | GCSValidationResult;

  if (config.storageProvider === "s3") {
    console.log("  ☁️  Checking S3 bucket...");
    storageResult = await validateS3Bucket({
      bucket: config.storageBucket,
      region: config.storageRegion,
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    });
  } else {
    console.log("  ☁️  Checking GCS bucket...");
    storageResult = await validateGCSBucket({
      bucket: config.storageBucket,
      projectId: config.gcsProjectId,
      keyFilePath: config.gcsKeyFilePath,
    });
  }
  logResult("Storage", storageResult.success, storageResult.message, storageResult.details);

  const allPassed = dbResult.success && storageResult.success;

  console.log("");
  if (allPassed) {
    console.log("✅ All services validated successfully!\n");
  } else {
    console.log("❌ Some services failed validation. Check the errors above.\n");
  }

  return {
    database: dbResult,
    storage: storageResult,
    allPassed,
  };
}

function logResult(
  service: string,
  success: boolean,
  message: string,
  details?: Record<string, unknown>
): void {
  const icon = success ? "✓" : "✗";
  const color = success ? "\x1b[32m" : "\x1b[31m";
  const reset = "\x1b[0m";

  console.log(`     ${color}${icon}${reset} ${message}`);

  if (details && Object.keys(details).length > 0) {
    const detailsStr = Object.entries(details)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
    if (detailsStr) {
      console.log(`       ${detailsStr}`);
    }
  }
}
