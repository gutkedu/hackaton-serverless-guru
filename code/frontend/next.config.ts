import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // This will ignore ESLint errors during builds
  },
  env: {
    API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.API_BASE_URL ||
      "https://gz8ep2fj9g.execute-api.us-east-1.amazonaws.com/api",
  },
};

export default nextConfig;
