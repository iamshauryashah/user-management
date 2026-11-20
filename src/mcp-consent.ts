import { verifyOAuthQueryParams } from "@better-auth/oauth-provider";
import { makeAuth, type Env } from "./auth";

// Consent is deliberately first-party and admin-only. The OAuth query is signed
// by Better Auth; never trust client_id or redirect_uri read directly from the URL.
const htmlEscape = (value: string) => value.replace(/[&<>"']/g, (ch) =>
  ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[ch]!);
const html = (content: string, status = 200) => new Response(content, {
  status, headers: {
    "Content-Type":"text/html; charset=utf-8",
    "Cache-Control":"no-store",
    "Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'",
    "X-Content-Type-Options":"nosniff",
    "Referrer-Policy":"no-referrer"
  }
});
export async function consentPage(request: Request, env: Env, auth: ReturnType<typeof makeAuth>) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return html("<p>Sign in to Shaurya's Websites before authorizing this connection.</p>",401);
  const row = await env.DB.prepare("SELECT is_admin FROM user_access WHERE user_id=?")
    .bind(session.user.id).first<{is_admin:number}>();
  if (row?.is_admin !== 1) return html("<p>Only platform administrators can grant Feedback write access.</p>",403);
  const params = new URL(request.url).searchParams;
  const names = new Set(["sig", "ba_param", ...params.getAll("ba_param")]);
  const signedParams = new URLSearchParams();
  params.forEach((value, key) => { if (names.has(key)) signedParams.append(key,value); });
  const oauthQuery = signedParams.toString();
  const context = await auth.$context;
  if (!oauthQuery || !(await verifyOAuthQueryParams(oauthQuery, context.secret))) {
    return html("<p>Invalid or expired authorization request. Start again from ChatGPT.</p>",400);
  }
  const signed = new URLSearchParams(oauthQuery);
  const clientId = signed.get("client_id") || "Unknown client";
  const redirectUri = signed.get("redirect_uri") || "";
  let target = redirectUri;
  try { target = new URL(redirectUri).host || redirectUri; } catch { /* Show literal redirect URI */ }
  // Do not imply a self-registered client's name is verified; display the signed ID and return host.
  const content = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Authorize Feedback access · Shaurya's Websites</title></head>
<body style="font:16px system-ui;max-width:580px;margin:8vh auto;padding:24px;line-height:1.5">
<h1>Connect an application to Feedback?</h1>
<p>You're signing in with your existing <strong>Shaurya's Websites</strong> account. This application requests permission to change <strong>Feedback card statuses only</strong>.</p>
<p>It cannot modify users, games, navigation, feedback messages or private submitter emails.</p>
<p><strong>Requesting client ID:</strong> <code>${htmlEscape(clientId)}</code></p>
<p><strong>Authorization response destination:</strong> <code>${htmlEscape(target)}</code></p>
<p><strong>Important:</strong> A client registers its own identity. Only approve a destination you recognize.</p>
<button id="approve" type="button" style="padding:12px;margin-right:12px">Approve Feedback access</button>
<button id="deny" type="button" style="padding:12px">Deny</button>
<p id="result" role="status"></p><script src="/mcp-consent.js" defer></script></body></html>`;
  return html(content);
}
