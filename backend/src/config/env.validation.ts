/**
 * Validates required environment variables at application startup.
 * Throws an error with all missing variables listed at once.
 */
export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const required: string[] = ['JWT_SECRET', 'DATABASE_URL', 'REDIS_URL', 'FRONTEND_URL'];

  const missing = required.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}.\n` +
        'Please check your .env file.',
    );
  }

  return config;
}
