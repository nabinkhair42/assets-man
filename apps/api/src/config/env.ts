import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import type { StorageConfig } from "@repo/storage";

// Load .env from apps/api/.env regardless of working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");
dotenv.config({ path: envPath });

const envSchema = z.object({
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_URL: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  // Storage configuration
  STORAGE_PROVIDER: z.enum(["s3", "gcs"]).default("s3"),
  STORAGE_BUCKET: z.string().min(1, "STORAGE_BUCKET is required"),
  STORAGE_REGION: z.string().optional(),
  // S3 credentials
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  // S3-compatible endpoint (for MinIO, R2, etc.)
  S3_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().optional(),
  // GCS credentials
  GCS_PROJECT_ID: z.string().optional(),
  GCS_KEY_FILE_PATH: z.string().optional(),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;

// Storage config helper
export function getStorageConfig(): StorageConfig {
  return {
    provider: config.STORAGE_PROVIDER,
    bucket: config.STORAGE_BUCKET,
    region: config.STORAGE_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    endpoint: config.S3_ENDPOINT,
    forcePathStyle: config.S3_FORCE_PATH_STYLE,
    projectId: config.GCS_PROJECT_ID,
    keyFilePath: config.GCS_KEY_FILE_PATH,
  };
}
