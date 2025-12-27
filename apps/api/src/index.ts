import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "@/config/env.js";
import { healthRouter, notFoundHandler } from "@/features/app/index.js";
import { authRouter } from "@/features/auth/auth-route.js";
import { folderRouter } from "@/features/folders/index.js";
import { assetRouter } from "@/features/assets/index.js";
import { trashRouter } from "@/features/trash/index.js";
import { validateServices } from "@/service-validator/index.js";

const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/folders", folderRouter);
app.use("/api/assets", assetRouter);
app.use("/api/trash", trashRouter);

// 404 handler
app.use(notFoundHandler);

async function startServer() {
  // Validate services before starting
  const validation = await validateServices({
    databaseUrl: config.DATABASE_URL,
    storageProvider: config.STORAGE_PROVIDER,
    storageBucket: config.STORAGE_BUCKET,
    storageRegion: config.STORAGE_REGION,
    awsAccessKeyId: config.AWS_ACCESS_KEY_ID,
    awsSecretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    gcsProjectId: config.GCS_PROJECT_ID,
    gcsKeyFilePath: config.GCS_KEY_FILE_PATH,
  });

  if (!validation.allPassed) {
    if (config.NODE_ENV === "production") {
      console.error("❌ Service validation failed. Exiting...");
      process.exit(1);
    } else {
      console.warn("⚠️  Some services failed validation. Continuing in development mode...\n");
    }
  }

  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
