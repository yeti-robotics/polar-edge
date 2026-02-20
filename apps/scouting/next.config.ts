import type { NextConfig } from "next";

const defaultOrigins = [
  "scout.yetirobotics.org",
  "scouting.svc.int.yukigamine.net",
  "localhost:3000",
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : defaultOrigins;

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
    localPatterns: [
      {
        pathname: "/pit-photo",
      },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
    esmExternals: true,
  },
};

export default nextConfig;
