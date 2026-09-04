import { Exception } from '@adonisjs/core/exceptions'

/**
 * Thrown when a refresh token is missing, invalid, expired or has already
 * been rotated (reuse detection). Results in a 401 — the client must
 * re-authenticate.
 */
export default class InvalidRefreshTokenException extends Exception {
  static status = 401
  static code = 'E_INVALID_REFRESH_TOKEN'
  static message = 'Invalid or expired refresh token'
}
