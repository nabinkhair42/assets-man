import express from "express";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "@/config/env.js";
import { corsMiddleware, allowedOrigins } from "@/config/cors.js";
import { apiRouter, healthRouter } from "@/routes/api.js";
import { appRouter, notFoundHandler } from "@/features/app/index.js";
import { validateServices, logConfig } from "@/service-validator/index.js";

const app = express();

// Middleware
app.use(compression());
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/", appRouter);
app.use("/health", healthRouter);
app.use("/api", apiRouter);
app.use(notFoundHandler);

// Start server
async function startServer() {
  logConfig({
    nodeEnv: config.NODE_ENV,
    port: config.PORT,
    clientUrl: config.CLIENT_URL,
    storageProvider: config.STORAGE_PROVIDER,
    storageBucket: config.STORAGE_BUCKET,
    storageRegion: config.STORAGE_REGION,
    allowedOrigins,
  });

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

  if (!validation.allPassed && config.NODE_ENV === "production") {
    console.error("❌ Service validation failed. Exiting...");
    process.exit(1);
  }

  app.listen(config.PORT, () => {
    console.log(`🚀 Server running on port ${config.PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
