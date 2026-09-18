import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // src/lib/db.ts reads db/schema.sql at runtime; make sure serverless bundles carry it.
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/schema.sql"],
  },
};

export default nextConfig;
