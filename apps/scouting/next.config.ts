import { NextConfig } from "next";

const nextConfig = {
	// Configure `pageExtensions` to include MDX files
	pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
	// Optionally, add any other Next.js config below
	output: "standalone",
	outputFileTracingIncludes: {
		"/": ["lib/database/drizzle/**"],
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
} satisfies NextConfig;

export default nextConfig;
