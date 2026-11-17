import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
}

export function makeAuth(env: Env) {
  const db = drizzle(env.DB, { schema });
  return betterAuth({
    appName: "Shaurya's Websites",
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "sqlite", schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      autoSignIn: true
    },
    user: {
      additionalFields: {
        avatarName: { type: "string", required: false, input: true }
      }
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24
    },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: !env.BETTER_AUTH_URL.startsWith("http://localhost"),
      crossSubDomainCookies: env.BETTER_AUTH_URL.startsWith("https://")
        ? { enabled: true, domain: "shauryaswebsites.com" }
        : { enabled: false }
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
      storage: "database",
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 }
      }
    },
    trustedOrigins: [
      "https://shauryaswebsites.com",
      "https://www.shauryaswebsites.com",
      "https://shauryaswebsite.com",
      "https://www.shauryaswebsite.com",
      "https://gerry.shauryaswebsite.com",
      "https://midterm-uj.shauryaswebsite.com",
      "https://race.shauryaswebsite.com",
      "https://hello.shauryaswebsite.com",
      "https://army.shauryaswebsite.com",
      "https://presidentialsim.shauryaswebsites.com",
      "https://soccersim.shauryaswebsites.com",
      "https://soccermanager.shauryaswebsites.com",
      "https://qed.shauryaswebsites.com",
      "https://feedback.shauryaswebsites.com",
      "https://secret.shauryaswebsites.com",
      env.BETTER_AUTH_URL
    ]
  });
}
