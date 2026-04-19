import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // maximum number of clients in the pool
  min: 2,                     // minimum clients to keep ready
  idleTimeoutMillis: 30000,   // close idle clients after 30s
  connectionTimeoutMillis: 5000, // fail fast if can't connect in 5s
  allowExitOnIdle: false,
});
export const db = drizzle(pool, { schema });

export * from "./schema";
