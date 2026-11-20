# MCP OAuth rollout — staged, not deployed

**Goal:** ChatGPT can use the existing Shaurya's Websites login to request the
narrow `mcp:feedback.write` scope. Only current platform administrators can
move existing Feedback cards between the five Kanban columns. No account, game,
navigation, message, email, creation, or deletion writes are permitted.

## Architecture
1. **Issuer:** existing Better Auth instance at `auth.shauryaswebsites.com/api/auth`.
   Better Auth owns OAuth 2.1 authorization code + S256 PKCE, dynamic client
   registration, consent, JWT signing, refresh and revocation.
2. **Protected resource:** `https://mcp.shauryaswebsites.com/mcp`. It validates
   token signature via issuer JWKS, issuer, exact audience, OAuth access token
   type, `azp`, expiry, and `mcp:feedback.write` scope.
3. **Live authorization:** each write calls User Management's
   `GET /api/mcp/write-access` via the service binding. User Management
   derives the user ID from an independently verified OAuth bearer token
   (never from client-supplied JSON) and reads the live `user_access.is_admin` flag.
4. **Mutation:** only the Feedback Durable Object's existing fixed `/update`
   path, with an existing UUID and allowed status; the only changed fields are
   `status` and `updated_at`.
5. Existing Feedback read tools remain anonymous, unchanged and email-free.

## Migration safety
- `migrations/0005_mcp_oauth.sql` is additive. It adds eight OAuth/JWKS tables
  without altering the existing `user`, `session`, `account` or access tables.
- The generated reference schema is `scripts/generated-auth-schema.ts`;
  production `src/schema.ts` keeps its original core table definitions and
  adds only the plugin tables.
- CI tests apply all migrations to a database containing an existing account
  and session and assert both survive unchanged. CI also typechecks.
- A GitHub Actions helper generates the dependency lockfile and reference
  schema on the **feature branch only**.

## Release sequence (do not skip)
1. Review both draft PRs: User Management and Shaurya's Websites MCP.
2. Confirm the generated schema matches the additive migration and that the
   OAuth issuer can be exercised safely in a staging environment.
3. Apply the additive D1 migration before deploying the changed identity Worker:
   `npx wrangler d1 migrations apply user-management --remote` from this branch,
   with authorized Cloudflare access and a backup/rollback procedure.
   **Do not perform this from an automated PR workflow.**
4. Merge/deploy User Management. Verify existing login/signup/logout, the
   OAuth issuer metadata, registration, consent, PKCE, JWKS, refresh, and
   `/api/mcp/write-access` for both admin and nonadmin users.
5. Merge/deploy the MCP OAuth branch. Verify both read tools still work; test
   an unauthenticated write gets a 401 OAuth challenge, a normal user's write
   gets denied, an administrator's single card update succeeds, and expired /
   wrong-audience tokens are rejected.
6. Reconnect or update the ChatGPT MCP connection to OAuth. ChatGPT must
   perform the browser login and consent flow; the existing no-auth connection
   cannot silently gain write privileges.
7. Only then move the requested nine-dot Feedback card to `Done`.

## Limitations until end-to-end test
- The OAuth code is on feature branches. The live website and ChatGPT connector
  are not yet authenticated for writes.
- CI unit tests do not prove a complete external ChatGPT OAuth exchange.
- Dynamic registration is intentionally allowed for compatibility with MCP
  clients, but client identities are self-declared. Consent displays the
  redirect destination and must not present untrusted names/logos as verified.
- No broad cross-application write capability is introduced.
