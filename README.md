# Shaurya's Websites — User Management

One identity. One login. Many experiences.

Cloudflare Worker + D1 + Better Auth MVP for platform-wide email/password signup, login, logout and one unique public avatar name across all games.

## Scope

- Guests can browse and play public games without authentication.
- Registered users have one permanent platform ID and persistent session.
- Each account uses a unique case-insensitive email and optional unique case-insensitive avatar name (3–24 letters, numbers, underscores).
- Avatar names are shared across applications; game-specific team names remain application-owned.
- Passwords require at least 12 characters. Better Auth handles credential hashing and session tokens.
- Reserved names: admin, administrator, root, system, support, moderator, shaurya, staff, official.
- Sign-in/up rate limiting is persisted in D1. Logout invalidates the active session.
- No billing, premium entitlements, password reset email or email verification in v1.

## Cloudflare setup

1. Run `npm install`.
2. Run `npx wrangler d1 create user-management`, and paste its `database_id` into `wrangler.toml`.
3. Generate a high-entropy secret: `openssl rand -base64 48`.
4. For local use: copy `.dev.vars.example` to `.dev.vars`, replace its secret, and run `npm run db:local` then `npm run dev`. Visit `http://localhost:8787`.
5. For production: `npx wrangler secret put BETTER_AUTH_SECRET`, then `npm run db:remote` and `npm run deploy`. Add `auth.shauryaswebsites.com` as the custom domain in Cloudflare Workers settings.
6. Set your Cloudflare DNS / custom domain to serve HTTPS before testing production login.

**Do not commit** your real secret or production D1 database ID if you prefer to keep deployment details private (the database ID is not a password). Never commit `.dev.vars`.

### Health check

`GET /health` returns a JSON status. `GET /api/me` returns the signed-in user's ID, email and avatar name, or `null` when guest. `GET /api/avatar-availability?name=Example` checks a name. Better Auth runs at `/api/auth/*`.

### Integration approach

The account UI is hosted at `auth.shauryaswebsites.com`. Existing public applications **must not be changed until separately integrated**. The recommended next step is a shared account menu/launcher that redirects to this first-party login page rather than embedding passwords in each game. App-owned permissions and player progress must be keyed by the immutable user ID, not the email or avatar name.

Better Auth is configured for cross-subdomain cookies for `shauryaswebsites.com`. **The legacy `shauryaswebsite.com` domain is a separate site** and requires a deliberate redirect/code-exchange or proxy-based SSO solution, not shared cookies. Do not use third-party-cookie-based SSO.

### Security / production readiness

Before opening public signup: verify deployment using real D1, check dependency/runtime compatibility, exercise rate limiting, duplicate-email and duplicate-avatar races, and test login/logout in Safari, Chrome and Firefox. Configure Cloudflare WAF / bot protections if abuse emerges. Email ownership is **not yet verified**; do not use email as proof of ownership for privileged actions. Add recovery and verification before handling purchases.

The migration is kept in `migrations/0001_initial.sql`; changes to Better Auth's schema must be accompanied by a new migration.
