-- Access state is separate from identity; existing users default to standard.
-- Never assign elevated privileges from client-supplied registration fields.
CREATE TABLE IF NOT EXISTS user_access (
 user_id TEXT PRIMARY KEY NOT NULL REFERENCES user(id) ON DELETE CASCADE,
 is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0,1)),
 is_premium INTEGER NOT NULL DEFAULT 0 CHECK (is_premium IN (0,1)),
 updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
