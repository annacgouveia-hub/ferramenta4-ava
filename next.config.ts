import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

// Load non-NEXT_PUBLIC_ vars from .env.local explicitly for server-side access
function loadServerEnv() {
  try {
    const envPath = join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx < 0) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      if (!key.startsWith("NEXT_PUBLIC_") && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // .env.local may not exist in production
  }
}

loadServerEnv();

const nextConfig: NextConfig = {};

export default nextConfig;
