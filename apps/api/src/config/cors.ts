import cors from "cors";
import { config } from "./env.js";

const allowedOrigins = [
  config.CLIENT_URL,
  config.CLIENT_URL.replace("https://", "http://"),
  config.CLIENT_URL.replace("http://", "https://"),
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

export { allowedOrigins };

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.some((allowed) => origin.startsWith(allowed.replace(/\/$/, "")))) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
});
