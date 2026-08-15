import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/analysis",
        permanent: false,
      },
    ];
  },
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
