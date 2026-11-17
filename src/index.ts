import { makeAuth, type Env } from "./auth";
import { handleAdmin } from "./admin";

const RESERVED = new Set(["admin", "administrator", "root", "system", "support", "moderator", "shaurya", "staff", "official"]);
const NAME = /^[a-zA-Z0-9_]{3,24}$/;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

// Credentialed widget requests are only accepted from our own public site origins.
const DOMAINS = ["shauryaswebsite.com", "shauryaswebsites.com"];
function allowedOrigin(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port || url.username || url.password) return null;
    return DOMAINS.some(domain => url.hostname === domain || url.hostname.endsWith("." + domain)) ? url.origin : null;
  } catch { return null; }
}
function withCors(response: Response, origin: string | null): Response {
  if (!origin) return response;
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.append("Vary", "Origin");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = allowedOrigin(request.headers.get("Origin"));
    if (url.pathname === "/widget.js") return env.ASSETS.fetch(request);
    if (url.pathname === "/health") return json({ ok: true, service: "user-management" });
    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      if (!origin) return json({ error: "Origin not allowed" }, 403);
      return new Response(null, { status: 204, headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "600",
        "Vary": "Origin"
      } });
    }
    // Cross-origin mutations require a trusted origin (Better Auth also checks CSRF).
    if (request.method !== "GET" && request.method !== "HEAD" && request.headers.get("Origin") && !origin) {
      return json({ error: "Origin not allowed" }, 403);
    }
    const cors = (response: Response) => withCors(response, origin);
    if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
      return cors(json({ error: "Authentication is not configured" }, 503));
    }

    const auth = makeAuth(env);
    if (url.pathname.startsWith("/api/admin/")) {
      // Never expose the admin API via cross-origin JavaScript.
      if (request.headers.get("Origin") && request.headers.get("Origin") !== new URL(env.BETTER_AUTH_URL).origin) {
        return json({ message: "Forbidden origin" }, 403);
      }
      return handleAdmin(request, env, auth);
    }
    if (url.pathname === "/api/avatar-availability" && request.method === "GET") {
      const name = (url.searchParams.get("name") || "").trim();
      if (!NAME.test(name) || RESERVED.has(name.toLowerCase())) {
        return cors(json({ available: false, reason: "Use 3–24 letters, numbers or underscores; some names are reserved." }));
      }
      const match = await env.DB.prepare("SELECT id FROM user WHERE avatar_name = ? COLLATE NOCASE LIMIT 1").bind(name).first();
      return cors(json({ available: !match }));
    }
    if (url.pathname === "/api/me" && request.method === "GET") {
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session) return cors(json(null));
      // No row means standard (also covers every existing account).
      const access = await env.DB.prepare(
        "SELECT is_admin, is_premium FROM user_access WHERE user_id = ? LIMIT 1"
      ).bind(session.user.id).first<{ is_admin: number; is_premium: number }>();
      const isAdmin = access?.is_admin === 1;
      const isPremium = access?.is_premium === 1;
      const userType = isAdmin ? "admin" : isPremium ? "premium" : "standard";
      return cors(json({
        id: session.user.id,
        email: session.user.email,
        avatarName: (session.user as { avatarName?: string }).avatarName ?? null,
        userType,
        isAdmin,
        isPremium
      }));
    }
    if (url.pathname.startsWith("/api/auth/")) {
      // Validate and normalize signup fields on the server, not merely in the browser.
      if (url.pathname === "/api/auth/sign-up/email" && request.method === "POST") {
        let body: Record<string, unknown>;
        try { body = await request.json() as Record<string, unknown>; }
        catch { return cors(json({ message: "Invalid JSON" }, 400)); }
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const avatarName = typeof body.avatarName === "string" ? body.avatarName.trim() : "";
        if (!email || email.length > 254) return cors(json({ message: "Please enter a valid email address." }, 400));
        if (typeof body.password !== "string" || body.password.length < 12) return cors(json({ message: "Password must be at least 12 characters." }, 400));
        if (avatarName && (!NAME.test(avatarName) || RESERVED.has(avatarName.toLowerCase()))) {
          return cors(json({ message: "Avatar name must be 3–24 letters, numbers or underscores and not reserved." }, 400));
        }
        if (avatarName) {
          const existing = await env.DB.prepare("SELECT id FROM user WHERE avatar_name = ? COLLATE NOCASE LIMIT 1").bind(avatarName).first();
          if (existing) return cors(json({ message: "That avatar name is already taken." }, 409));
        }
        const updated = { ...body, email, name: avatarName || "Player", avatarName: avatarName || undefined };
        const headers = new Headers(request.headers);
        headers.delete("content-length");
        const rewritten = new Request(request.url, { method: "POST", headers, body: JSON.stringify(updated) });
        try { return cors(await auth.handler(rewritten)); }
        catch { return cors(json({ message: "Unable to create account. The email or avatar name may already be in use." }, 409)); }
      }
      return cors(await auth.handler(request));
    }
    if (url.pathname === "/admin" || url.pathname === "/admin/") {
      return env.ASSETS.fetch(new Request(new URL("/admin.html", url), request));
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
