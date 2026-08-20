import "server-only";
import * as z from "zod";

/**
 * Every environment variable the server touches is validated once, at
 * module load, so a missing/malformed value fails fast at boot with a clear
 * message instead of surfacing as a confusing runtime error three requests
 * later (e.g. "Cannot read property 'sign' of undefined").
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 characters (openssl rand -base64 32)"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}\n\nCopy .env.example to .env and fill in real values.`);
}

export const env = parsed.data;
