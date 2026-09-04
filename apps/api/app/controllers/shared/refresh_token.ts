import type { HttpResponse } from '@adonisjs/core/http'
import { refreshTokenCookieName, refreshTokenCookieOptions } from '#config/refresh_token'

/**
 * HTTP-layer helpers for the refresh token cookie. Controllers only — the
 * services stay HTTP-agnostic.
 */
export function setRefreshTokenCookie(response: HttpResponse, token: string) {
  response.plainCookie(refreshTokenCookieName, token, refreshTokenCookieOptions)
}

export function clearRefreshTokenCookie(response: HttpResponse) {
  response.clearCookie(refreshTokenCookieName, { path: '/' })
}
