export function getNodeEnv() {
  return process.env.NODE_ENV;
}

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.BETTER_AUTH_URL && process.env.BETTER_AUTH_URL !== "http://localhost:3000")
    return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function toTitleCase(string: string) {
  return `${string.charAt(0).toUpperCase()}${string.slice(1)}`;
}
