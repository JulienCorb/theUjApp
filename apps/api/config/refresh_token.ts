import app from '@adonisjs/core/services/app'

/**
 * Authentication token lifetimes (single source of truth).
 *
 * Access tokens are short-lived and sent as `Authorization: Bearer` on
 * every API call. Refresh tokens are long-lived, rotate on every use and
 * travel in an httpOnly cookie (or secure storage for non-browser clients
 * in a later phase).
 */
export const accessTokenTtl = '15 minutes'
export const refreshTokenTtl = '30 days'

export const accessTokenPrefix = 'oat_'
export const refreshTokenPrefix = 'oatr_'

/**
 * The httpOnly cookie carrying the refresh token. It is a plain (unsigned,
 * unencrypted) cookie set on login, invitation accept and refresh, and
 * cleared on logout. Browsers send it automatically to the refresh
 * endpoint — JavaScript never reads it.
 */
export const refreshTokenCookieName = 'refresh_token'

export const refreshTokenCookieOptions = {
  maxAge: refreshTokenTtl,
  httpOnly: true,
  secure: app.inProduction,
  sameSite: 'lax' as const,
  path: '/',
}
