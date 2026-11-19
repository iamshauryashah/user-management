import type { Env } from "./auth";
import { handlePageAdministration } from "./page-access";

const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
  status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
});
type AuthService = ReturnType<typeof import("./auth").makeAuth>;
type AdminRow = { is_admin: number; is_premium: number };
type UserRow = { id: string; email: string; avatar_name: string | null; created_at: number; is_admin: number; is_premium: number };

export async function handleAdmin(request: Request, env: Env, auth: AuthService): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;
  if (method !== "GET" && method !== "POST") return response({ message: "Method not allowed" }, 405);
  // Administrative endpoints never accept cross-site requests, including otherwise trusted app origins.
  if (method === "POST" && request.headers.get("Origin") !== new URL(env.BETTER_AUTH_URL).origin) {
    return response({ message: "Forbidden origin" }, 403);
  }
  if (method === "POST" && !(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return response({ message: "JSON required" }, 415);
  }
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return response({ message: "Sign in required" }, 401);
  const actor = session.user.id;
  const current = await env.DB.prepare("SELECT is_admin FROM user_access WHERE user_id = ?").bind(actor).first<{ is_admin: number }>();
  if (current?.is_admin !== 1) return response({ message: "Administrator access required" }, 403);

  if (url.pathname === "/api/admin/pages" || url.pathname.startsWith("/api/admin/pages/")) {
    return handlePageAdministration(request, env);
  }

  if (url.pathname === "/api/admin/users" && method === "GET") {
    const search = (url.searchParams.get("q") || "").trim().slice(0, 100);
    const limit = 50;
    const page = Math.min(10000, Math.max(0, Number.parseInt(url.searchParams.get("page") || "0", 10) || 0));
    const where = search ? "WHERE lower(u.email) LIKE ? ESCAPE '\\' OR lower(coalesce(u.avatar_name, '')) LIKE ? ESCAPE '\\'" : "";
    const escaped = search.toLowerCase().replace(/[\\%_]/g, c => "\\" + c);
    const searchArg = "%" + escaped + "%";
    const sql = "SELECT u.id, u.email, u.avatar_name, u.created_at, " +
      "coalesce(a.is_admin, 0) AS is_admin, coalesce(a.is_premium, 0) AS is_premium " +
      "FROM user u LEFT JOIN user_access a ON a.user_id = u.id " + where +
      " ORDER BY u.created_at DESC, u.id ASC LIMIT ? OFFSET ?";
    const stmt = env.DB.prepare(sql);
    const values = search ? [searchArg, searchArg, limit + 1, page * limit] : [limit + 1, page * limit];
    const rows = await stmt.bind(...values).all<UserRow>();
    return response({ users: (rows.results || []).slice(0, limit).map(u => ({
      id: u.id, email: u.email, avatarName: u.avatar_name,
      createdAt: u.created_at, isAdmin: u.is_admin === 1, isPremium: u.is_premium === 1,
      userType: u.is_admin === 1 ? "admin" : u.is_premium === 1 ? "premium" : "standard"
    })), hasMore: (rows.results || []).length > limit, page });
  }

  const match = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/access$/);
  if (!match || method !== "POST") return response({ message: "Not found" }, 404);
  const userId = decodeURIComponent(match[1]);
  if (!userId || userId.length > 256) return response({ message: "Invalid user" }, 400);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ message: "Invalid JSON" }, 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return response({ message: "Invalid payload" }, 400);
  const payload = body as Record<string, unknown>;
  if (typeof payload.isAdmin !== "boolean" || typeof payload.isPremium !== "boolean" ||
    Object.keys(payload).some(k => k !== "isAdmin" && k !== "isPremium")) {
    return response({ message: "Only isAdmin and isPremium booleans are permitted" }, 400);
  }
  const target = await env.DB.prepare("SELECT id FROM user WHERE id = ?").bind(userId).first();
  if (!target) return response({ message: "Account not found" }, 404);
  const previous = await env.DB.prepare("SELECT is_admin, is_premium FROM user_access WHERE user_id = ?")
    .bind(userId).first<AdminRow>();
  // Do not let an administrator accidentally remove their own administrative privileges.
  if (actor === userId && !payload.isAdmin) return response({ message: "You cannot revoke your own admin access" }, 409);
  if (previous?.is_admin === 1 && !payload.isAdmin) {
    const count = await env.DB.prepare("SELECT count(*) AS n FROM user_access WHERE is_admin = 1").first<{ n: number }>();
    if (!count || count.n <= 1) return response({ message: "Cannot remove the last administrator" }, 409);
  }
  // A missing record is standard; grants must be explicit and made by a verified admin.
  const updated = await env.DB.prepare(
    "INSERT INTO user_access (user_id, is_admin, is_premium, updated_at) VALUES (?, ?, ?, unixepoch()) " +
    "ON CONFLICT(user_id) DO UPDATE SET is_admin=excluded.is_admin, is_premium=excluded.is_premium, updated_at=unixepoch() " +
    "WHERE excluded.is_admin = 1 OR user_access.is_admin = 0 " +
    "OR (SELECT count(*) FROM user_access WHERE is_admin=1)>1"
  ).bind(userId, payload.isAdmin ? 1 : 0, payload.isPremium ? 1 : 0).run();
  if (!updated.meta.changes) return response({ message: "Access could not be updated" }, 409);
  return response({ ok: true, userId, isAdmin: payload.isAdmin, isPremium: payload.isPremium,
    userType: payload.isAdmin ? "admin" : payload.isPremium ? "premium" : "standard" });
}
