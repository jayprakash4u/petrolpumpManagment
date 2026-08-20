import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const root = import.meta.dirname;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    // The integration suite creates its own SQLite database and shares one
    // Prisma client, so its files must not run in parallel with each other.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(root, "src"),
      // `server-only` is a marker package that throws unless the bundler
      // picks the "react-server" condition. Vitest isn't an RSC bundler, so
      // point it at the same no-op file Next.js would resolve to on the
      // server — the guard is a build-time concern, not a runtime one.
      "server-only": path.resolve(root, "node_modules/server-only/empty.js"),
    },
  },
});
