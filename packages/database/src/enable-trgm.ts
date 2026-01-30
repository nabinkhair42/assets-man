import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import postgres from "postgres";

async function enableTrgm() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("Enabling pg_trgm extension...");

  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  console.log("Creating indexes...");

  // Create all trigram indexes in parallel (Rule 1.4)
  await Promise.all([
    db.execute(sql`CREATE INDEX IF NOT EXISTS idx_assets_name_trgm ON assets USING GIN (name gin_trgm_ops)`),
    db.execute(sql`CREATE INDEX IF NOT EXISTS idx_assets_original_name_trgm ON assets USING GIN (original_name gin_trgm_ops)`),
    db.execute(sql`CREATE INDEX IF NOT EXISTS idx_folders_name_trgm ON folders USING GIN (name gin_trgm_ops)`),
  ]);

  console.log("Done!");

  await client.end();
}

enableTrgm().catch(console.error);
