import env from '#start/env'

/**
 * Configuration for the invitation feature.
 *
 * All environment access for this feature happens here — application code
 * must import from this config instead of reading env vars directly.
 */
export const webAppUrl = env.get('WEB_APP_URL')

/**
 * Validity window of an invitation link in days.
 */
export const ttlDays = env.get('INVITATION_TTL_DAYS', 7)

/**
 * HMAC key used to hash invitation tokens before storage.
 *
 * Required (no fallback to APP_KEY): the dedicated secret keeps token
 * protection independent of the master key. Rotating it invalidates every
 * outstanding invitation link.
 */
export const hmacSecret = env.get('INVITATION_SECRET').release()
