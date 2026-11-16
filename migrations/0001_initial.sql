-- Better Auth core tables, with one platform-wide public avatar name per user.
CREATE TABLE IF NOT EXISTS user (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL,
 email TEXT NOT NULL,
 email_verified INTEGER NOT NULL DEFAULT 0,
 image TEXT,
 avatar_name TEXT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique ON user(email COLLATE NOCASE);
CREATE UNIQUE INDEX IF NOT EXISTS user_avatar_name_unique ON user(avatar_name COLLATE NOCASE) WHERE avatar_name IS NOT NULL;

CREATE TABLE IF NOT EXISTS session (
 id TEXT PRIMARY KEY NOT NULL,
 expires_at INTEGER NOT NULL,
 token TEXT NOT NULL UNIQUE,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 ip_address TEXT,
 user_agent TEXT,
 user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS session_user_id_idx ON session(user_id);

CREATE TABLE IF NOT EXISTS account (
 id TEXT PRIMARY KEY NOT NULL,
 account_id TEXT NOT NULL,
 provider_id TEXT NOT NULL,
 user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
 access_token TEXT,
 refresh_token TEXT,
 id_token TEXT,
 access_token_expires_at INTEGER,
 refresh_token_expires_at INTEGER,
 scope TEXT,
 password TEXT,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_user_id_idx ON account(user_id);

CREATE TABLE IF NOT EXISTS verification (
 id TEXT PRIMARY KEY NOT NULL,
 identifier TEXT NOT NULL,
 value TEXT NOT NULL,
 expires_at INTEGER NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
