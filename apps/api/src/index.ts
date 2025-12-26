import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "@/config/env.js";
import { healthRouter, notFoundHandler } from "@/features/app/index.js";
import { authRouter } from "@/features/auth/auth-route.js";
import { folderRouter } from "@/features/folders/index.js";
import { assetRouter } from "@/features/assets/index.js";

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

// 404 handler
app.use(notFoundHandler);

app.listen(config.PORT, () => {
  console.log(`Server running on port ${config.PORT}`);
});
