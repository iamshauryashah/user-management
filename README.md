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
- User types are now modeled as **guest**, **standard**, **premium**, and **admin**. Subscription purchases/billing, password reset email, and email verification are not implemented yet.
- `guest` = no authenticated session; `standard` = signed in without premium/admin flags; `premium` = signed in with premium; `admin` = signed in with admin role (takes display precedence).
- Admin role and premium status are **independent**: an admin can also be premium. Each flag defaults to false, including for previously created accounts.

## Cloudflare setup

1. Run `npm install`.
2. Run `npx wrangler d1 create user-management`, and paste its `database_id` into `wrangler.toml`.
3. Generate a high-entropy secret: `openssl rand -base64 48`.
4. For local use: copy `.dev.vars.example` to `.dev.vars`, replace its secret, and run `npm run db:local` then `npm run dev`. Visit `http://localhost:8787`.
5. For production: `npx wrangler secret put BETTER_AUTH_SECRET`, then `npm run db:remote` and `npm run deploy`. Add `auth.shauryaswebsites.com` as the custom domain in Cloudflare Workers settings.
6. Set your Cloudflare DNS / custom domain to serve HTTPS before testing production login.

**Do not commit** your real secret or production D1 database ID if you prefer to keep deployment details private (the database ID is not a password). Never commit `.dev.vars`.

### Access model and migration

**Before deploying code that reads user types**, apply the new migration (the initial migration is already installed):

```bash
npx wrangler d1 migrations apply user-management --remote
```

Migration `0002_user_types.sql` creates `user_access`, keyed by the permanent `user.id`. Existing accounts require no backfill: a missing row means **standard**. Signup never accepts role or premium entitlement fields.

`GET /api/me` returns `null` for guests, or an authenticated profile with `userType` (`standard`, `premium`, or `admin`), `isAdmin` and `isPremium`. Access checks must always run on trusted servers, not on the widget's UI state.

**Bootstrap an administrator only through authorized database administration, never by modifying client-side fields.** For a verified target account, run this from the secure Wrangler environment with the correct user ID substituted:

```sql
INSERT INTO user_access (user_id, is_admin, is_premium, updated_at)
VALUES ('EXISTING_USER_ID', 1, 0, unixepoch())
ON CONFLICT(user_id) DO UPDATE
SET is_admin = 1, updated_at = unixepoch();
```

To assign premium manually for initial testing, use the same approach with `is_premium = 1`, without modifying `is_admin`. Only account administrators should perform these changes. Later, subscription billing will update entitlements via verified server-to-server events. No self-service role upgrade endpoint exists.

### Health check

`GET /health` returns a JSON status. `GET /api/me` returns the signed-in user's ID, email and avatar name, or `null` when guest. `GET /api/avatar-availability?name=Example` checks a name. Better Auth runs at `/api/auth/*`.

### Integration approach

The account UI and shared glass widget are hosted at `auth.shauryaswebsites.com`. Public applications load a single shared `widget.js` script; login/signup/logout stay inline. Individual applications still own gameplay permissions and progress, keyed by the immutable user ID rather than email or avatar name.

Better Auth is configured for cross-subdomain cookies for `shauryaswebsites.com`. **The legacy `shauryaswebsite.com` domain is a separate site** and requires a deliberate redirect/code-exchange or proxy-based SSO solution, not shared cookies. Do not use third-party-cookie-based SSO.

### Security / production readiness

Before opening public signup: verify deployment using real D1, check dependency/runtime compatibility, exercise rate limiting, duplicate-email and duplicate-avatar races, and test login/logout in Safari, Chrome and Firefox. Configure Cloudflare WAF / bot protections if abuse emerges. Email ownership is **not yet verified**; do not use email as proof of ownership for privileged actions. Add recovery and verification before handling purchases.

The migration is kept in `migrations/0001_initial.sql`; changes to Better Auth's schema must be accompanied by a new migration.

## Admin dashboard

The administrative directory is available at **https://auth.shauryaswebsites.com/admin** after deploying the current Worker.

It offers read-only user directory search (50 results per page), avatar/email/creation date, and explicit **Save** controls to grant or revoke Premium and Admin privileges. Admin status and Premium status remain independent. A user cannot remove their own admin role; the server also prevents removing the last administrator. Each API operation checks the Better Auth session and a server-owned admin flag. Admin mutations require JSON and an exact same-origin request.

**Bootstrap the first administrator once through D1, not through public sign-up:**

1. Register the intended admin account normally using the login widget or first-party account page.
2. In Cloudflare D1, run a SELECT to verify its email and user ID:

```bash
npx wrangler d1 execute user-management --remote --command "SELECT id, email, avatar_name FROM user WHERE email = 'YOUR_EMAIL@example.com' COLLATE NOCASE;"
```

3. Only after confirming the intended account and ownership, grant the role by email. Replace the email in the following command with the verified account's email:

```bash
npx wrangler d1 execute user-management --remote --command "INSERT INTO user_access (user_id, is_admin, is_premium, updated_at) SELECT id, 1, 0, unixepoch() FROM user WHERE email = 'YOUR_EMAIL@example.com' COLLATE NOCASE ON CONFLICT(user_id) DO UPDATE SET is_admin=1, updated_at=unixepoch();"
```

4. Log in to the same account at `auth.shauryaswebsites.com`, then open `/admin`. Do not share credentials or password hashes.

The directory is restricted to authenticated admins; visiting `/admin` does not grant privileges. Admin activity auditing and stronger admin authentication (e.g., MFA) should be implemented before delegating privileges broadly.

### Gerry saved maps integration

Gerry's canonical origin (`https://gerry.shauryaswebsites.com`) uses the same
first-party session as the account widget. Its own Worker verifies the session
through a service binding to this Worker and owns all map storage; authentication
does not store game state. The member menu includes a **My Gerry maps** link.
Gerry can open the existing inline account panel by dispatching
`window.dispatchEvent(new CustomEvent('shaurya:auth-open'))`; account changes
continue to use the existing `shaurya:auth-changed` event. No login UI is copied
into Gerry.

The lockfile records compatible Better Auth/Drizzle dependencies; use `npm ci`
for reproducible installs. Run `npm run typecheck` before deploying.
