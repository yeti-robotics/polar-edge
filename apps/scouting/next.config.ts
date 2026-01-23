import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Optionally, add any other Next.js config below
  output: "standalone",
  outputFileTracingIncludes: {
    "/": ["lib/database/drizzle/**"],
  },
  cacheComponents: true,
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "scout.yetirobotics.org",
        "scouting.svc.int.yukigamine.net",
        "localhost:3000",
      ],
    },
    esmExternals: true,
  },
};

export default nextConfig;
