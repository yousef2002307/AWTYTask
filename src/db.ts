import { Pool } from 'pg';

export const db = new Pool({ connectionString: process.env.DATABASE_URL });

export async function runMigrations(): Promise<void> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id         UUID        PRIMARY KEY,
      status     TEXT        NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
      progress   INTEGER     NOT NULL DEFAULT 0,
      duration   INTEGER     NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}
