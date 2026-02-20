const REQUIRED_ENV_VARS = [
  "AUTH_SECRET",
  "PIT_PHOTO_TOKEN_SECRET",
  "TBA_API_KEY",
  "DATABASE_URL",
] as const;

export async function register() {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const missing = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables: ${missing.join(", ")}`
      );
    }

    console.log("running migration...");
    await import("./instrumentation.node");
  }
}
