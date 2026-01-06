export interface ConfigLogOptions {
  nodeEnv: string;
  port: number;
  clientUrl: string;
  storageProvider: string;
  storageBucket: string;
  storageRegion?: string;
  allowedOrigins: string[];
}

/**
 * Logs the application configuration at startup.
 * Sensitive values (secrets, keys) are not logged.
 */
export function logConfig(config: ConfigLogOptions): void {
  console.log("\n📋 Configuration:");
  console.log(`   NODE_ENV: ${config.nodeEnv}`);
  console.log(`   PORT: ${config.port}`);
  console.log(`   CLIENT_URL: ${config.clientUrl}`);
  console.log(`   STORAGE_PROVIDER: ${config.storageProvider}`);
  console.log(`   STORAGE_BUCKET: ${config.storageBucket}`);
  console.log(`   STORAGE_REGION: ${config.storageRegion || "default"}`);
  console.log(`   Allowed CORS origins: ${config.allowedOrigins.join(", ")}`);
}
