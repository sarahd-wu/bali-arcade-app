import { Pool } from "pg";

const globalForPostgres = globalThis;

export const pool =
  globalForPostgres.postgresPool ??
  new Pool({
    user: process.env.DB_USER || process.env.PGUSER || "postgres",
    password: process.env.DB_PASS || process.env.PGPASSWORD,
    host: process.env.DB_HOST || process.env.PGHOST || "localhost",
    database: process.env.DB_NAME || process.env.PGDATABASE || "bali_arcade",
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = pool;
}

export function databaseError(error) {
  console.error("PostgreSQL request failed:", error);
  return Response.json(
    { error: "The database request could not be completed." },
    { status: 500 },
  );
}
