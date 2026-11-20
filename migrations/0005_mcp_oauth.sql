-- Additive OAuth 2.1 / MCP tables for Better Auth 1.7.27.
-- Never replace or alter the platform's existing user, session, or account tables.
-- Generated from scripts/generated-auth-schema.ts and reviewed before deployment.

CREATE TABLE IF NOT EXISTS jwks (
  id TEXT PRIMARY KEY,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER,
  alg TEXT,
  crv TEXT
);

CREATE TABLE IF NOT EXISTS oauth_client (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL UNIQUE,
  client_secret TEXT,
  client_discovery_id TEXT,
  disabled INTEGER DEFAULT 0,
  skip_consent INTEGER,
  enable_end_session INTEGER,
  subject_type TEXT,
  scopes TEXT,
  client_credentials_scopes TEXT DEFAULT '[]',
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  created_at INTEGER,
  updated_at INTEGER,
  name TEXT,
  uri TEXT,
  icon TEXT,
  contacts TEXT,
  tos TEXT,
  policy TEXT,
  software_id TEXT,
  software_version TEXT,
  software_statement TEXT,
  redirect_uris TEXT NOT NULL,
  post_logout_redirect_uris TEXT,
  backchannel_logout_uri TEXT,
  backchannel_logout_session_required INTEGER,
  token_endpoint_auth_method TEXT,
  application_type TEXT,
  jwks TEXT,
  jwks_uri TEXT,
  grant_types TEXT,
  response_types TEXT,
  require_pkce INTEGER,
  dpop_bound_access_tokens INTEGER DEFAULT 0,
  reference_id TEXT,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS oauth_resource (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  access_token_ttl INTEGER,
  refresh_token_ttl INTEGER,
  signing_algorithm TEXT,
  signing_key_id TEXT,
  allowed_scopes TEXT,
  custom_claims TEXT,
  dpop_bound_access_tokens_required INTEGER DEFAULT 0,
  disabled INTEGER DEFAULT 0,
  created_at INTEGER,
  updated_at INTEGER,
  policy_version INTEGER DEFAULT 1,
  metadata TEXT
);

CREATE TABLE IF NOT EXISTS oauth_client_resource (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES oauth_client(client_id) ON DELETE CASCADE,
  resource_id TEXT NOT NULL REFERENCES oauth_resource(identifier) ON DELETE CASCADE,
  metadata TEXT,
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS oauth_refresh_token (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES oauth_client(client_id) ON DELETE CASCADE,
  session_id TEXT REFERENCES session(id) ON DELETE SET NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  reference_id TEXT,
  authorization_code_id TEXT,
  resources TEXT,
  requested_user_info_claims TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked INTEGER,
  rotated_at INTEGER,
  rotation_replay_response TEXT,
  rotation_replay_expires_at INTEGER,
  auth_time INTEGER,
  confirmation TEXT,
  scopes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_access_token (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  client_id TEXT NOT NULL REFERENCES oauth_client(client_id) ON DELETE CASCADE,
  session_id TEXT REFERENCES session(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  reference_id TEXT,
  authorization_code_id TEXT,
  resources TEXT,
  requested_user_info_claims TEXT,
  refresh_id TEXT REFERENCES oauth_refresh_token(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  revoked INTEGER,
  confirmation TEXT,
  scopes TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_consent (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES oauth_client(client_id) ON DELETE CASCADE,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  reference_id TEXT,
  resources TEXT,
  requested_user_info_claims TEXT,
  scopes TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_client_assertion (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS oauth_client_userId_idx ON oauth_client(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS oauth_client_resource_clientId_resourceId_uidx ON oauth_client_resource(client_id, resource_id);
CREATE INDEX IF NOT EXISTS oauth_client_resource_clientId_idx ON oauth_client_resource(client_id);
CREATE INDEX IF NOT EXISTS oauth_client_resource_resourceId_idx ON oauth_client_resource(resource_id);
CREATE INDEX IF NOT EXISTS oauth_refresh_token_clientId_idx ON oauth_refresh_token(client_id);
CREATE INDEX IF NOT EXISTS oauth_refresh_token_sessionId_idx ON oauth_refresh_token(session_id);
CREATE INDEX IF NOT EXISTS oauth_refresh_token_userId_idx ON oauth_refresh_token(user_id);
CREATE INDEX IF NOT EXISTS oauth_refresh_token_authorizationCodeId_idx ON oauth_refresh_token(authorization_code_id);
CREATE INDEX IF NOT EXISTS oauth_access_token_clientId_idx ON oauth_access_token(client_id);
CREATE INDEX IF NOT EXISTS oauth_access_token_sessionId_idx ON oauth_access_token(session_id);
CREATE INDEX IF NOT EXISTS oauth_access_token_userId_idx ON oauth_access_token(user_id);
CREATE INDEX IF NOT EXISTS oauth_access_token_authorizationCodeId_idx ON oauth_access_token(authorization_code_id);
CREATE INDEX IF NOT EXISTS oauth_access_token_refreshId_idx ON oauth_access_token(refresh_id);
CREATE INDEX IF NOT EXISTS oauth_consent_clientId_idx ON oauth_consent(client_id);
CREATE INDEX IF NOT EXISTS oauth_consent_userId_idx ON oauth_consent(user_id);
