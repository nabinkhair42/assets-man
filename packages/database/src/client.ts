import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index";

type DbInstance = PostgresJsDatabase<typeof schema>;

// Cache: one pool per connection string to avoid creating multiple pools
const dbCache = new Map<string, DbInstance>();

export function createDb(connectionString: string): DbInstance {
  const existing = dbCache.get(connectionString);
  if (existing) return existing;

  const client = postgres(connectionString, { max: 20 });
  const db = drizzle(client, { schema });
  dbCache.set(connectionString, db);
  return db;
}

export type Database = DbInstance;
