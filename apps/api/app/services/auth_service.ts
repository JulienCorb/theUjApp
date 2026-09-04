import { errors } from '@adonisjs/auth'
import { AccessToken, type AccessToken as AccessTokenType } from '@adonisjs/auth/access_tokens'
import { Secret } from '@adonisjs/core/helpers'
import hash from '@adonisjs/core/services/hash'
import db from '@adonisjs/lucid/services/db'

import { refreshTokenPrefix } from '#config/refresh_token'
import InvalidRefreshTokenException from '#exceptions/invalid_refresh_token_exception'
import User from '#models/user'

export type TokenPair = { user: User; accessToken: string; refreshToken: string }

/**
 * Business logic around authentication: credential verification, access +
 * refresh token issuance/rotation and token revocation.
 *
 * Controllers must delegate to this service instead of implementing
 * auth logic themselves. The service stays free of HTTP concerns
 * (no HttpContext) so it can be reused by CLI commands and tests.
 */
export default class AuthService {
  /**
   * Verifies the given credentials and issues a fresh access + refresh
   * token pair.
   *
   * Users that were invited but have not accepted their invitation yet have
   * no password and are rejected with the same generic error as invalid
   * credentials (no account-state enumeration).
   *
   * @throws {@link errors.E_INVALID_CREDENTIALS} when the credentials are
   * invalid
   */
  async login(email: string, password: string): Promise<TokenPair> {
    const normalizedEmail = email.trim().toLowerCase()
    const user = await User.findBy('email', normalizedEmail)

    if (!user || !user.password) {
      if (!user) {
        await hash.make(password)
      }
      throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }

    const isValidPassword = await user.verifyPassword(password)
    if (!isValidPassword) {
      throw new errors.E_INVALID_CREDENTIALS('Invalid user credentials')
    }

    return this.issueTokenPair(user)
  }

  /**
   * Issues a fresh access + refresh token pair for the user.
   */
  async issueTokenPair(user: User): Promise<TokenPair> {
    const accessToken = await User.accessTokens.create(user)
    const refreshToken = await User.refreshTokens.create(user)

    return {
      user,
      accessToken: accessToken.value!.release(),
      refreshToken: refreshToken.value!.release(),
    }
  }

  /**
   * Validates and rotates the given refresh token, issuing a new access +
   * refresh token pair. The consumed refresh token is soft-revoked (expired
   * in place, row kept) so replays can be detected.
   *
   * The soft-revoke is guarded (`expires_at > now()`) and the pair is only
   * issued when exactly one row is affected: when two requests race with the
   * same token, only the first one rotates — the loser gets a 401 without a
   * new pair, so a refresh token can never mint two valid successors.
   *
   * Reuse detection: a token that fails verification but still has a row in
   * the database was rotated or revoked — a stolen refresh token was
   * replayed, so every token of the user is revoked and the user must
   * re-authenticate.
   *
   * @throws {@link InvalidRefreshTokenException} when the token is missing,
   * invalid, expired, replayed or already rotated
   */
  async rotateRefreshToken(refreshTokenValue: string): Promise<TokenPair> {
    const token = await User.refreshTokens.verify(new Secret(refreshTokenValue))

    if (token) {
      const user = await User.findOrFail(token.tokenableId)

      const revoked = await db
        .from('auth_access_tokens')
        .where('id', String(token.identifier))
        .where('type', 'refresh_token')
        .where('expires_at', '>', new Date())
        .update({ expires_at: new Date() })

      if (!revoked) {
        throw new InvalidRefreshTokenException()
      }

      return this.issueTokenPair(user)
    }

    const decoded = AccessToken.decode(refreshTokenPrefix, refreshTokenValue)
    if (decoded) {
      const row = await db
        .from('auth_access_tokens')
        .where('id', decoded.identifier)
        .where('type', 'refresh_token')
        .first()

      if (row) {
        const user = await User.find(row.tokenable_id)
        if (user) {
          await this.revokeAllTokens(user)
        }
      }
    }

    throw new InvalidRefreshTokenException()
  }

  /**
   * Revokes the access token attached to the current request and, when a
   * refresh token is presented (e.g. via the refresh cookie), revokes it too.
   */
  async logout(user: User, refreshTokenValue: string | null, accessToken: AccessTokenType) {
    await User.accessTokens.delete(user, accessToken.identifier)

    if (refreshTokenValue) {
      await User.refreshTokens.invalidate(new Secret(refreshTokenValue))
    }
  }

  /**
   * Updates the user's password.
   *
   * Transaction ownership stays with the caller: bind the instance with
   * `user.useTransaction(client)` before delegating when the change must be
   * atomic with other writes.
   */
  async changePassword(user: User, password: string) {
    user.password = password
    await user.save()
  }

  /**
   * Revokes every access and refresh token of the user (e.g. after a
   * password reset or detected refresh-token reuse).
   */
  async revokeAllTokens(user: User) {
    await User.accessTokens.deleteAll(user)
    await User.refreshTokens.deleteAll(user)
  }
}
