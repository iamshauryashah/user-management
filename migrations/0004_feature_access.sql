-- Per-feature eligibility, independently configurable from page visibility.
CREATE TABLE IF NOT EXISTS feature_access (
  feature_key TEXT PRIMARY KEY NOT NULL,
  guest INTEGER NOT NULL DEFAULT 0 CHECK (guest IN (0,1)),
  standard INTEGER NOT NULL DEFAULT 0 CHECK (standard IN (0,1)),
  premium INTEGER NOT NULL DEFAULT 1 CHECK (premium IN (0,1)),
  admin INTEGER NOT NULL DEFAULT 1 CHECK (admin IN (0,1)),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
