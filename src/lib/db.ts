import { readFileSync } from "node:fs";
import path from "node:path";
import { Pool } from "pg";

// Server-only Postgres access. DATABASE_URL points at the local Homebrew
// instance in development; any hosted Postgres works unchanged.

const globalForPg = globalThis as unknown as { pgPool?: Pool; pgReady?: Promise<void> };

export const pool =
  globalForPg.pgPool ??
  (globalForPg.pgPool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }));

// Apply db/schema.sql once per server process (all statements are idempotent).
export function ready(): Promise<void> {
  return (globalForPg.pgReady ??= pool
    .query(readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8"))
    .then(() => undefined));
}

export async function query<T extends object>(text: string, params: unknown[] = []) {
  await ready();
  const result = await pool.query<T>(text, params);
  return result.rows;
}
