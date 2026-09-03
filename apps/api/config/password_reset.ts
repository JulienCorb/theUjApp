import env from '#start/env'

/**
 * Configuration for the password reset feature.
 *
 * All environment access for this feature happens here — application code
 * must import from this config instead of reading env vars directly.
 */
export const webAppUrl = env.get('WEB_APP_URL')

/**
 * Validity window of a password reset link in minutes.
 */
export const ttlMinutes = env.get('PASSWORD_RESET_TTL_MINUTES', 60)

/**
 * HMAC key used to hash password reset tokens before storage. Falls back to
 * the application key when no dedicated secret is configured.
 */
export const hmacSecret =
  env.get('PASSWORD_RESET_SECRET')?.release() || env.get('APP_KEY').release()
