import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // "standalone" output is for self-hosting (the Dockerfile in this repo
  // copies .next/standalone into the runtime image). It must NOT be set
  // when building on Vercel — Vercel's own build pipeline produces its own
  // optimized, traced output, and forcing "standalone" mode conflicts with
  // it (build fails with an ENOENT on next-server.js.nft.json). Vercel sets
  // the VERCEL env var during its builds, so skip it there.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
};

export default nextConfig;
