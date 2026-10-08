-- Standalone reference; the app also runs this idempotently via runMigrations() on startup.
CREATE TABLE IF NOT EXISTS tasks (
  id         UUID        PRIMARY KEY,
  status     TEXT        NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress   INTEGER     NOT NULL DEFAULT 0,
  duration   INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
