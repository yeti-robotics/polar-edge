import { type Env, envSchema } from "./config.schema";

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(`Environment validation failed:\n${result.error.toString()}`);
  }

  return result.data;
}
