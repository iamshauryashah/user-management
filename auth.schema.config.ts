// CLI-only schema discovery for the exact same auth factory used in production.
// The database stub is never queried: auth generate --adapter drizzle --dialect sqlite
// only inspects the Better Auth core and plugin schemas. No production credentials.
import { makeAuth, type Env } from "./src/auth";
const mock: Env = {
  DB: {} as Env["DB"],
  ASSETS: {} as Env["ASSETS"],
  BETTER_AUTH_SECRET: "dev-schema-generation-not-for-production-0000000",
  BETTER_AUTH_URL: "https://auth.shauryaswebsites.com"
};
export const auth = makeAuth(mock);
