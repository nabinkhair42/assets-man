import postgres from "postgres";

export interface DbValidationResult {
  success: boolean;
  message: string;
  details?: {
    host?: string;
    database?: string;
    version?: string;
  };
}

export async function validateDbConnection(
  connectionString: string
): Promise<DbValidationResult> {
  const client = postgres(connectionString, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  try {
    // Test connection with a simple query
    const result = await client`SELECT version() as version, current_database() as database`;
    const row = result[0];

    await client.end();

    return {
      success: true,
      message: "Database connection successful",
      details: {
        database: row?.database as string,
        version: (row?.version as string)?.split(" ")[0] + " " + (row?.version as string)?.split(" ")[1],
      },
    };
  } catch (error) {
    try {
      await client.end();
    } catch {
      // Ignore cleanup errors
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    return {
      success: false,
      message: `Database connection failed: ${errorMessage}`,
    };
  }
}
