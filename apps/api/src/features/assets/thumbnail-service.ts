import sharp from "sharp";
import { Readable } from "stream";
import { eq } from "drizzle-orm";
import { createDb, assets } from "@repo/database";
import { createStorageClient, generateThumbnailKey, type StorageClient } from "@repo/storage";
import { config } from "@/config/env.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas } from "@napi-rs/canvas";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";
import fs from "fs";
import path from "path";
import os from "os";

// Get ffmpeg path as string
const ffmpegPath = ffmpegStatic as unknown as string;

const execFileAsync = promisify(execFile);

const db = createDb(config.DATABASE_URL);

// Thumbnail configuration
const THUMBNAIL_CONFIG = {
  width: 300,
  height: 300,
  quality: 80,
  format: "webp" as const,
};

// Supported MIME types for thumbnail generation
const SUPPORTED_IMAGE_TYPES = new Set([
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
]);

const SUPPORTED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const SUPPORTED_PDF_TYPES = new Set([
  "application/pdf",
]);

// Check if a MIME type supports thumbnail generation
export function canGenerateThumbnail(mimeType: string): boolean {
  return (
    SUPPORTED_IMAGE_TYPES.has(mimeType) ||
    SUPPORTED_VIDEO_TYPES.has(mimeType) ||
    SUPPORTED_PDF_TYPES.has(mimeType)
  );
}

// Check if it's an image type
export function isImageType(mimeType: string): boolean {
  return SUPPORTED_IMAGE_TYPES.has(mimeType);
}

// Check if it's a video type
export function isVideoType(mimeType: string): boolean {
  return SUPPORTED_VIDEO_TYPES.has(mimeType);
}

// Check if it's a PDF type
export function isPdfType(mimeType: string): boolean {
  return SUPPORTED_PDF_TYPES.has(mimeType);
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

// Generate thumbnail for a PDF (render first page)
async function generatePdfThumbnail(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
    });
    const pdfDocument = await loadingTask.promise;

    // Get first page
    const page = await pdfDocument.getPage(1);

    // Set scale for thumbnail (aim for ~600px width for better quality before resize)
    const viewport = page.getViewport({ scale: 1 });
    const scale = 600 / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    // Create canvas
    const canvas = createCanvas(scaledViewport.width, scaledViewport.height);
    const context = canvas.getContext("2d");

    // Render page to canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    await page.render(renderContext).promise;

    // Convert canvas to PNG buffer
    const pngBuffer = await canvas.encode("png");

    // Resize with sharp to final thumbnail size
    const thumbnailBuffer = await sharp(pngBuffer)
      .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
        fit: "cover",
        position: "top",
      })
      .webp({ quality: THUMBNAIL_CONFIG.quality })
      .toBuffer();

    return thumbnailBuffer;
  } catch (error) {
    console.error("Error generating PDF thumbnail:", error);
    return null;
  }
}

// Generate thumbnail for a video (extract frame at 1 second)
async function generateVideoThumbnail(videoBuffer: Buffer): Promise<Buffer | null> {
  if (!ffmpegPath) {
    console.error("ffmpeg-static path not available");
    return null;
  }

  // Create temp files for video input and image output
  const tempDir = os.tmpdir();
  const timestamp = Date.now();
  const tempVideoPath = path.join(tempDir, `video-${timestamp}.mp4`);
  const tempImagePath = path.join(tempDir, `thumbnail-${timestamp}.png`);

  try {
    // Write video buffer to temp file
    fs.writeFileSync(tempVideoPath, videoBuffer);

    // Try to extract frame at 1 second first
    try {
      await execFileAsync(ffmpegPath, [
        "-y",
        "-ss", "1",
        "-i", tempVideoPath,
        "-vframes", "1",
        "-vf", "scale=600:-1",
        tempImagePath,
      ]);
    } catch {
      // If 1 second fails, try at 0.1 seconds (for short videos)
      await execFileAsync(ffmpegPath, [
        "-y",
        "-ss", "0.1",
        "-i", tempVideoPath,
        "-vframes", "1",
        "-vf", "scale=600:-1",
        tempImagePath,
      ]);
    }

    if (!fs.existsSync(tempImagePath)) {
      console.error("Failed to extract video frame");
      return null;
    }

    // Read the extracted frame
    const frameBuffer = fs.readFileSync(tempImagePath);

    // Resize with sharp to final thumbnail size
    const thumbnailBuffer = await sharp(frameBuffer)
      .resize(THUMBNAIL_CONFIG.width, THUMBNAIL_CONFIG.height, {
        fit: "cover",
        position: "center",
      })
      .webp({ quality: THUMBNAIL_CONFIG.quality })
      .toBuffer();

    return thumbnailBuffer;
  } catch (error) {
    console.error("Error generating video thumbnail:", error);
    return null;
  } finally {
    // Cleanup temp files
    try {
      if (fs.existsSync(tempVideoPath)) fs.unlinkSync(tempVideoPath);
      if (fs.existsSync(tempImagePath)) fs.unlinkSync(tempImagePath);
    } catch {
      // Ignore cleanup errors
    }
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
    // Check if the file exists in storage before attempting to download
    const fileExists = await storage.exists(asset.storageKey);
    if (!fileExists) {
      return { success: false, error: "Source file not found in storage" };
    }

    // Download the original file
    const stream = await storage.getObjectStream(asset.storageKey);
    const fileBuffer = await streamToBuffer(stream);

    let thumbnailBuffer: Buffer | null = null;

    // Generate thumbnail based on file type
    if (isImageType(asset.mimeType)) {
      thumbnailBuffer = await generateImageThumbnail(fileBuffer);
    } else if (isVideoType(asset.mimeType)) {
      thumbnailBuffer = await generateVideoThumbnail(fileBuffer);
    } else if (isPdfType(asset.mimeType)) {
      thumbnailBuffer = await generatePdfThumbnail(fileBuffer);
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
  const BATCH_SIZE = 5;

  for (let i = 0; i < assetIds.length; i += BATCH_SIZE) {
    const batch = assetIds.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map((id) => generateThumbnail(id)));
    results.push(...batchResults);
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
