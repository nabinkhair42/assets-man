import sharp from "sharp";
import { Readable } from "stream";
import { eq } from "drizzle-orm";
import { createDb, assets } from "@repo/database";
import { createStorageClient, generateThumbnailKey, type StorageClient } from "@repo/storage";
import { config } from "@/config/env.js";

const db = createDb(config.DATABASE_URL);

// Thumbnail configuration
const THUMBNAIL_CONFIG = {
  width: 300,
  height: 300,
  quality: 80,
  format: "webp" as const,
};

// Supported MIME types for thumbnail generation
const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
];

const SUPPORTED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
];

// Check if a MIME type supports thumbnail generation
export function canGenerateThumbnail(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType) || SUPPORTED_VIDEO_TYPES.includes(mimeType);
}

// Check if it's an image type
export function isImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(mimeType);
}

// Check if it's a video type
export function isVideoType(mimeType: string): boolean {
  return SUPPORTED_VIDEO_TYPES.includes(mimeType);
}

// Convert a readable stream to a buffer
async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

// Generate thumbnail for an image
async function generateImageThumbnail(imageBuffer: Buffer): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
      fit: "cover",
      position: "center",
    })
    .webp({ quality: THUMBNAIL_CONFIG.quality })
    .toBuffer();
}

// Generate thumbnail for a video (extract first frame)
// Note: This requires ffmpeg to be installed on the system
async function generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer | null> {
  try {
    // For video thumbnails, we need ffmpeg
    // This is a placeholder - in production, you'd use fluent-ffmpeg or similar
    // For now, we'll skip video thumbnails and return null
    console.log("Video thumbnail generation requires ffmpeg - skipping");
    return null;
  } catch (error) {
    console.error("Error generating video thumbnail:", error);
    return null;
  }
}

// Create storage client
function getStorage(): StorageClient {
  return createStorageClient({
    provider: config.STORAGE_PROVIDER,
    bucket: config.STORAGE_BUCKET,
    region: config.STORAGE_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    projectId: config.GCS_PROJECT_ID,
    keyFilePath: config.GCS_KEY_FILE_PATH,
  });
}

export interface ThumbnailResult {
  success: boolean;
  thumbnailKey?: string;
  error?: string;
}

// Generate and upload thumbnail for an asset
export async function generateThumbnail(assetId: string): Promise<ThumbnailResult> {
  const storage = getStorage();

  // Get asset from database
  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, assetId),
  });

  if (!asset) {
    return { success: false, error: "Asset not found" };
  }

  // Check if thumbnail already exists
  if (asset.thumbnailKey) {
    return { success: true, thumbnailKey: asset.thumbnailKey };
  }

  // Check if we can generate a thumbnail for this type
  if (!canGenerateThumbnail(asset.mimeType)) {
    return { success: false, error: `Unsupported file type: ${asset.mimeType}` };
  }

  try {
    // Download the original file
    const stream = await storage.getObjectStream(asset.storageKey);
    const fileBuffer = await streamToBuffer(stream);

    let thumbnailBuffer: Buffer | null = null;

    // Generate thumbnail based on file type
    if (isImageType(asset.mimeType)) {
      thumbnailBuffer = await generateImageThumbnail(fileBuffer);
    } else if (isVideoType(asset.mimeType)) {
      thumbnailBuffer = await generateVideoThumbnail(fileBuffer);
    }

    if (!thumbnailBuffer) {
      return { success: false, error: "Failed to generate thumbnail" };
    }

    // Generate thumbnail key
    const thumbnailKey = generateThumbnailKey(asset.storageKey) + ".webp";

    // Upload thumbnail
    await storage.uploadBuffer({
      key: thumbnailKey,
      buffer: thumbnailBuffer,
      contentType: "image/webp",
    });

    // Update asset record
    await db
      .update(assets)
      .set({ thumbnailKey, updatedAt: new Date() })
      .where(eq(assets.id, assetId));

    return { success: true, thumbnailKey };
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Batch generate thumbnails for multiple assets
export async function generateThumbnailsBatch(assetIds: string[]): Promise<ThumbnailResult[]> {
  const results: ThumbnailResult[] = [];

  for (const assetId of assetIds) {
    const result = await generateThumbnail(assetId);
    results.push(result);
  }

  return results;
}

// Get thumbnail URL for an asset
export async function getThumbnailUrl(assetId: string): Promise<string | null> {
  const storage = getStorage();

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, assetId),
  });

  if (!asset?.thumbnailKey) {
    return null;
  }

  try {
    const { url } = await storage.getPresignedDownloadUrl({
      key: asset.thumbnailKey,
      expiresIn: 3600, // 1 hour
    });
    return url;
  } catch {
    return null;
  }
}
