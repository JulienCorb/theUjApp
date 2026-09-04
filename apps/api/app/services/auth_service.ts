import { errors } from '@adonisjs/auth'
import { type AccessToken } from '@adonisjs/auth/access_tokens'
import hash from '@adonisjs/core/services/hash'

import User from '#models/user'

/**
 * Business logic around authentication: credential verification, password
 * changes and token revocation.
 *
 * Controllers must delegate to this service instead of implementing
 * auth logic themselves. The service stays free of HTTP concerns
 * (no HttpContext) so it can be reused by CLI commands and tests.
 */
export default class AuthService {
  /**
   * Verifies the given credentials and issues a fresh access token.
   *
   * Users that were invited but have not accepted their invitation yet have
   * no password and are rejected with the same generic error as invalid
   * credentials (no account-state enumeration).
   *
   * @throws {@link errors.E_INVALID_CREDENTIALS} when the credentials are
   * invalid
   */
  async login(email: string, password: string) {
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

    const token = await this.createAccessToken(user)

    return { user, token }
  }

  /**
   * Issues a fresh access token for the user.
   */
  async createAccessToken(user: User): Promise<string> {
    const token = await User.accessTokens.create(user)

    return token.value!.release()
  }

  /**
   * Revokes the access token attached to the current session.
   */
  async logout(user: User, token: AccessToken) {
    await User.accessTokens.delete(user, token.identifier)
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
   * Revokes every access token of the user (e.g. after a password reset).
   */
  async revokeAllTokens(user: User) {
    await User.accessTokens.deleteAll(user)
  }
}
