import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, Turbopack walks up and finds a stray package-lock.json in
  // the parent (home) directory and treats it as the workspace root, which
  // can misresolve modules. Pin the root to this project explicitly.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
