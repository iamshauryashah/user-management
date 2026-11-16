import { makeAuth, type Env } from "./auth";

const RESERVED = new Set(["admin", "administrator", "root", "system", "support", "moderator", "shaurya", "staff", "official"]);
const NAME = /^[a-zA-Z0-9_]{3,24}$/;
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/health") return json({ ok: true, service: "user-management" });
    if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) {
      return json({ error: "Authentication is not configured" }, 503);
    }

    const auth = makeAuth(env);
    if (url.pathname === "/api/avatar-availability" && request.method === "GET") {
      const name = (url.searchParams.get("name") || "").trim();
      if (!NAME.test(name) || RESERVED.has(name.toLowerCase())) {
        return json({ available: false, reason: "Use 3–24 letters, numbers or underscores; some names are reserved." });
      }
      const match = await env.DB.prepare("SELECT id FROM user WHERE avatar_name = ? COLLATE NOCASE LIMIT 1").bind(name).first();
      return json({ available: !match });
    }
    if (url.pathname === "/api/me" && request.method === "GET") {
      const session = await auth.api.getSession({ headers: request.headers });
      return json(session ? { id: session.user.id, email: session.user.email, avatarName: (session.user as { avatarName?: string }).avatarName ?? null } : null);
    }
    if (url.pathname.startsWith("/api/auth/")) {
      // Validate and normalize signup fields on the server, not merely in the browser.
      if (url.pathname === "/api/auth/sign-up/email" && request.method === "POST") {
        let body: Record<string, unknown>;
        try { body = await request.json() as Record<string, unknown>; }
        catch { return json({ message: "Invalid JSON" }, 400); }
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        const avatarName = typeof body.avatarName === "string" ? body.avatarName.trim() : "";
        if (!email || email.length > 254) return json({ message: "Please enter a valid email address." }, 400);
        if (typeof body.password !== "string" || body.password.length < 12) return json({ message: "Password must be at least 12 characters." }, 400);
        if (avatarName && (!NAME.test(avatarName) || RESERVED.has(avatarName.toLowerCase()))) {
          return json({ message: "Avatar name must be 3–24 letters, numbers or underscores and not reserved." }, 400);
        }
        if (avatarName) {
          const existing = await env.DB.prepare("SELECT id FROM user WHERE avatar_name = ? COLLATE NOCASE LIMIT 1").bind(avatarName).first();
          if (existing) return json({ message: "That avatar name is already taken." }, 409);
        }
        const updated = { ...body, email, name: avatarName || "Player", avatarName: avatarName || undefined };
        const headers = new Headers(request.headers);
        headers.delete("content-length");
        const rewritten = new Request(request, { headers, body: JSON.stringify(updated) });
        try { return await auth.handler(rewritten); }
        catch { return json({ message: "Unable to create account. The email or avatar name may already be in use." }, 409); }
      }
      return auth.handler(request);
    }
    return env.ASSETS.fetch(request);
  }
} satisfies ExportedHandler<Env>;
