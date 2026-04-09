import { Pool } from "pg";
import { env } from "@/lib/config";

declare global {
  // eslint-disable-next-line no-var
  var __deasPool: Pool | undefined;
}

export function getPool() {
  if (global.__deasPool) {
    return global.__deasPool;
  }

  const pool = new Pool({
    connectionString: env.databaseUrl,
  });

  if (process.env.NODE_ENV !== "production") {
    global.__deasPool = pool;
  }

  return pool;
}
